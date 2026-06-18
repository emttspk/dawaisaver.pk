import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { UploadService } from "../ocr/upload.service";
import { buildRawHtmlObjectKey, canonicalizeRegistrationNumber, parseDrapMirrorPage } from "./drap.detail-parser";
import {
  DrapAcquisitionCheckpoint,
  DrapAcquisitionPlan,
  DrapAcquisitionR2Status,
  DrapMirrorImportItem,
  DrapMirrorImportSummary,
  DrapRegistrationEnumerationOptions,
} from "./drap.types";

export interface DrapDetailFetchResult {
  registrationNumber: string;
  requestUrl: string;
  httpStatus: number;
  html: string;
  finalUrl: string;
}

export interface DrapRegistrationProbe {
  registrationNumber: string;
  sourceUrl?: string;
}

export interface DrapMirrorRunOptions extends DrapAcquisitionPlan {}

@Injectable()
export class DrapAcquisitionService {
  private readonly uploadService: UploadService;

  constructor(private readonly prisma: PrismaService, uploadService = new UploadService()) {
    this.uploadService = uploadService;
  }

  verifyR2Configuration(): DrapAcquisitionR2Status {
    const required = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_BASE_URL",
    ];

    const present: string[] = [];
    const missing: string[] = [];

    for (const key of required) {
      if (String(process.env[key] || "").trim()) {
        present.push(key);
      } else {
        missing.push(key);
      }
    }

    return { required, present, missing };
  }

  enumerateRegistrations(options: DrapRegistrationEnumerationOptions): DrapRegistrationProbe[] {
    if (options.registrations && options.registrations.length > 0) {
      return dedupeRegistrations(
        options.registrations.map((registrationNumber) => ({
          registrationNumber,
        })),
        options.includeLegacyVariants,
      );
    }

    const start = parseRegistrationNumber(options.startRegistration || "000001");
    const end = parseRegistrationNumber(options.endRegistration || options.startRegistration || "000001");
    const probes: DrapRegistrationProbe[] = [];

    for (let value = start.numeric; value <= end.numeric; value += 1) {
      const registrationNumber = value.toString().padStart(start.width, "0");
      probes.push({ registrationNumber });
    }

    return dedupeRegistrations(probes, options.includeLegacyVariants);
  }

  async runMirrorAcquisition(plan: DrapMirrorRunOptions): Promise<DrapMirrorImportSummary> {
    const r2Status = this.verifyR2Configuration();
    const registrations = this.normalizePlan(plan);
    const checkpoint = this.resolveCheckpoint(plan, registrations.length);
    const batch = await this.ensureBatch(plan, registrations.length, r2Status, checkpoint);
    const seen = new Set<string>();
    const items: DrapMirrorImportItem[] = [];

    let fetchedRows = checkpoint.fetched;
    let parsedRows = checkpoint.parsed;
    let failedRows = checkpoint.failed;
    let duplicateRows = checkpoint.duplicate;
    let retryCount = checkpoint.retries;
    const checkpointEvery = Math.max(1, plan.checkpointEvery || 25);

    for (let index = checkpoint.nextIndex; index < registrations.length; index += 1) {
      const probe = registrations[index];
      const canonical = canonicalizeRegistrationNumber(probe.registrationNumber);

      if (seen.has(canonical)) {
        duplicateRows += 1;
        const duplicateItem = await this.recordItem(batch.id, index + 1, {
          registrationNumber: probe.registrationNumber,
          status: "DUPLICATE",
          retryCount: 0,
          rawData: {
            registrationNumber: probe.registrationNumber,
            sourceUrl: probe.sourceUrl || plan.sourceUrl,
            duplicateOf: canonical,
          },
          validationData: {
            stage: "duplicate",
            duplicateOf: canonical,
          },
          metadata: {
            acquisition: {
              stage: "duplicate",
              retryCount: 0,
            },
          },
          errorMessage: "Duplicate registration number in the same acquisition run.",
        });
        items.push(duplicateItem);
        continue;
      }

      seen.add(canonical);

      const fetchResult = await this.fetchDetailWithRetry(probe, plan.maxRetries || 3);
      retryCount += fetchResult.attempts - 1;

      const htmlHash = createHash("sha256").update(fetchResult.html, "utf8").digest("hex");
      const r2Key = buildRawHtmlObjectKey(canonical, fetchResult.html);
      const r2Object = await this.uploadService.uploadBuffer(Buffer.from(fetchResult.html, "utf8"), {
        originalName: `${canonical}.html`,
        mimeType: "text/html",
        folder: "drap/raw",
        objectKey: r2Key,
      });

      fetchedRows += 1;

      try {
        const parsed = parseDrapMirrorPage(fetchResult.html, fetchResult.finalUrl || fetchResult.requestUrl);
        parsed.rawHtmlUrl = r2Object.url;
        parsedRows += 1;

        const item = await this.recordItem(batch.id, index + 1, {
          registrationNumber: parsed.registrationNumber,
          status: "PARSED",
          retryCount: fetchResult.attempts - 1,
          rawData: {
            registrationNumber: parsed.registrationNumber,
            requestUrl: fetchResult.requestUrl,
            finalUrl: fetchResult.finalUrl,
            httpStatus: fetchResult.httpStatus,
            htmlHash,
            r2Key: r2Object.filename,
            r2Url: r2Object.url,
          } as Prisma.InputJsonValue,
          normalizedData: parsed as unknown as Prisma.InputJsonValue,
          validationData: {
            stage: "parsed",
            fetched: true,
            parsed: true,
            retryCount: fetchResult.attempts - 1,
          } as Prisma.InputJsonValue,
          metadata: {
            acquisition: {
              stage: "parsed",
              retryCount: fetchResult.attempts - 1,
              r2Key: r2Object.filename,
              r2Url: r2Object.url,
            },
          } as unknown as Prisma.InputJsonValue,
        });
        items.push(item);
      } catch (error) {
        failedRows += 1;
        const message = error instanceof Error ? error.message : "Failed to parse DRAP detail page.";

        const failedItem = await this.recordItem(batch.id, index + 1, {
          registrationNumber: probe.registrationNumber,
          status: "FAILED",
          retryCount: fetchResult.attempts - 1,
          rawData: {
            registrationNumber: probe.registrationNumber,
            requestUrl: fetchResult.requestUrl,
            finalUrl: fetchResult.finalUrl,
            httpStatus: fetchResult.httpStatus,
            htmlHash,
            r2Key: r2Object.filename,
            r2Url: r2Object.url,
          } as Prisma.InputJsonValue,
          validationData: {
            stage: "failed",
            fetched: true,
            parsed: false,
            retryCount: fetchResult.attempts - 1,
            errorMessage: message,
          } as Prisma.InputJsonValue,
          metadata: {
            acquisition: {
              stage: "failed",
              retryCount: fetchResult.attempts - 1,
              r2Key: r2Object.filename,
              r2Url: r2Object.url,
            },
          } as unknown as Prisma.InputJsonValue,
          errorMessage: message,
        });
        items.push(failedItem);
        await this.prisma.importError.create({
          data: {
            importBatchId: batch.id,
            rowNumber: index + 1,
            errorCode: "DRAP_DETAIL_PARSE_FAILED",
            errorMessage: message,
            rawData: {
              registrationNumber: probe.registrationNumber,
              requestUrl: fetchResult.requestUrl,
              r2Key: r2Object.filename,
            } as Prisma.InputJsonValue,
            status: "ACTIVE",
            sourceType: "DRAP",
            sourceUrl: fetchResult.finalUrl || fetchResult.requestUrl,
            metadata: {
              retryCount: fetchResult.attempts - 1,
              htmlHash,
            },
          },
        });
      }

      const checkpointState = this.buildCheckpoint({
        batchId: batch.id,
        nextIndex: index + 1,
        lastRegistrationNumber: probe.registrationNumber,
        processed: index + 1,
        fetched: fetchedRows,
        parsed: parsedRows,
        failed: failedRows,
        duplicate: duplicateRows,
        retries: retryCount,
      });

      if ((index + 1) % checkpointEvery === 0 || index === registrations.length - 1) {
        await this.updateBatchCheckpoint(batch.id, checkpointState, r2Status);
      }
    }

    const status = failedRows > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
    const checkpointState = this.buildCheckpoint({
      batchId: batch.id,
      nextIndex: registrations.length,
      lastRegistrationNumber: registrations.at(-1)?.registrationNumber,
      processed: registrations.length,
      fetched: fetchedRows,
      parsed: parsedRows,
      failed: failedRows,
      duplicate: duplicateRows,
      retries: retryCount,
    });

    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status,
        totalRows: registrations.length,
        validRows: parsedRows,
        invalidRows: failedRows,
        duplicateRows,
        savedRows: parsedRows,
        finishedAt: new Date(),
        importReport: {
          batchId: batch.id,
          status,
          totalRows: registrations.length,
          fetchedRows,
          parsedRows,
          failedRows,
          duplicateRows,
          retryCount,
          checkpoint: checkpointState,
          r2Status,
          items,
        } as unknown as Prisma.InputJsonValue,
        metadata: {
          acquisition: {
            batchId: batch.id,
            checkpoint: checkpointState,
            r2Status,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      batchId: batch.id,
      status,
      totalRows: registrations.length,
      fetchedRows,
      parsedRows,
      failedRows,
      duplicateRows,
      retryCount,
      checkpoint: checkpointState,
      r2Status,
      items,
    };
  }

  private normalizePlan(plan: DrapMirrorRunOptions): DrapRegistrationProbe[] {
    return dedupeRegistrations(
      plan.registrations.map((registration) => ({
        registrationNumber: registration.registrationNumber,
        sourceUrl: registration.sourceUrl || plan.sourceUrl,
      })),
      false,
    );
  }

  private resolveCheckpoint(plan: DrapMirrorRunOptions, totalRows: number): DrapAcquisitionCheckpoint {
    const fallback: DrapAcquisitionCheckpoint = {
      batchId: plan.batchId,
      nextIndex: 0,
      lastRegistrationNumber: undefined,
      processed: 0,
      fetched: 0,
      parsed: 0,
      failed: 0,
      duplicate: 0,
      retries: 0,
    };

    if (!plan.resumeFrom) {
      return fallback;
    }

    return {
      ...fallback,
      ...plan.resumeFrom,
      batchId: plan.batchId || plan.resumeFrom.batchId,
      nextIndex: Math.min(plan.resumeFrom.nextIndex, totalRows),
    };
  }

  private async ensureBatch(
    plan: DrapMirrorRunOptions,
    totalRows: number,
    r2Status: DrapAcquisitionR2Status,
    checkpoint: DrapAcquisitionCheckpoint,
  ): Promise<{ id: string }> {
    if (plan.batchId) {
      const existing = await this.prisma.importBatch.findUnique({
        where: { id: plan.batchId },
      });

      if (existing) {
        return { id: existing.id };
      }
    }

    return this.prisma.importBatch.create({
      data: {
        sourceType: "DRAP",
        sourceUrl: plan.sourceUrl || "https://eapp.dra.gov.pk/product_view_web.php",
        fileName: `drap-mirror-${new Date().toISOString().slice(0, 10)}.json`,
        adapterType: "drap-mirror",
        status: "RUNNING",
        totalRows,
        validRows: checkpoint.parsed,
        invalidRows: checkpoint.failed,
        duplicateRows: checkpoint.duplicate,
        savedRows: checkpoint.parsed,
        startedAt: new Date(),
        metadata: {
          acquisition: {
            mode: "drap-mirror",
            checkpoint,
            r2Status,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async updateBatchCheckpoint(
    batchId: string,
    checkpoint: DrapAcquisitionCheckpoint,
    r2Status: DrapAcquisitionR2Status,
  ): Promise<void> {
    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: {
        metadata: {
          acquisition: {
            checkpoint,
            r2Status,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async fetchDetailWithRetry(
    probe: DrapRegistrationProbe,
    maxRetries: number,
  ): Promise<DrapDetailFetchResult & { attempts: number }> {
    const registrationNumber = canonicalizeRegistrationNumber(probe.registrationNumber);
    const requestUrl = `https://eapp.dra.gov.pk/product_view_web.php?reg_no=${encodeURIComponent(registrationNumber)}`;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= Math.max(1, maxRetries); attempt += 1) {
      try {
        const response = await fetch(requestUrl, {
          headers: {
            "user-agent": process.env.CRAWLER_USER_AGENT || "DawaiSaverBot/0.1",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        const html = await response.text();
        if (!response.ok) {
          throw new Error(`DRAP detail fetch failed: ${response.status} ${response.statusText}`);
        }

        return {
          registrationNumber,
          requestUrl,
          httpStatus: response.status,
          html,
          finalUrl: response.url || requestUrl,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          await sleep(250 * attempt);
          continue;
        }
      }
    }

    throw lastError || new Error(`Unable to fetch DRAP registration ${registrationNumber}.`);
  }

  private buildCheckpoint(partial: DrapAcquisitionCheckpoint): DrapAcquisitionCheckpoint {
    return {
      batchId: partial.batchId,
      nextIndex: partial.nextIndex,
      lastRegistrationNumber: partial.lastRegistrationNumber,
      processed: partial.processed,
      fetched: partial.fetched,
      parsed: partial.parsed,
      failed: partial.failed,
      duplicate: partial.duplicate,
      retries: partial.retries,
    };
  }

  private async recordItem(
    batchId: string,
    rowNumber: number,
    item: {
      registrationNumber: string;
      status: DrapMirrorImportItem["status"];
      retryCount: number;
      rawData: Prisma.InputJsonValue;
      normalizedData?: Prisma.InputJsonValue;
      validationData?: Prisma.InputJsonValue;
      metadata?: Prisma.InputJsonValue;
      errorMessage?: string;
    },
  ): Promise<DrapMirrorImportItem> {
    const existing = await this.prisma.importBatchItem.findUnique({
      where: {
        importBatchId_rowNumber: {
          importBatchId: batchId,
          rowNumber,
        },
      },
    });

    const rawData = toRecord(item.rawData);
    const metadata = toRecord(item.metadata);

    const record: Prisma.ImportBatchItemUncheckedCreateInput = {
      importBatchId: batchId,
      rowNumber,
      rawData: item.rawData,
      normalizedData: item.normalizedData,
      validationData: item.validationData,
      status: item.status === "FAILED" ? "FAILED" : item.status === "DUPLICATE" ? "DUPLICATE" : "SAVED",
      sourceType: "DRAP",
      sourceUrl: typeof rawData.finalUrl === "string" ? rawData.finalUrl : undefined,
      metadata: {
        acquisition: {
          registrationNumber: item.registrationNumber,
          retryCount: item.retryCount,
          ...(metadata || {}),
        },
      } as unknown as Prisma.InputJsonValue,
    };

    if (existing) {
      await this.prisma.importBatchItem.update({
        where: {
          importBatchId_rowNumber: {
            importBatchId: batchId,
            rowNumber,
          },
        },
        data: record,
      });
    } else {
      await this.prisma.importBatchItem.create({
        data: record,
      });
    }

    return {
      registrationNumber: item.registrationNumber,
      status: item.status,
      retryCount: item.retryCount,
      rawHtmlUrl: typeof rawData.r2Url === "string" ? rawData.r2Url : undefined,
      parsed: item.normalizedData as unknown as DrapMirrorImportItem["parsed"],
      errorMessage: item.errorMessage,
      r2Key: typeof rawData.r2Key === "string" ? rawData.r2Key : undefined,
    };
  }
}

function dedupeRegistrations(
  registrations: DrapRegistrationProbe[],
  includeLegacyVariants?: boolean,
): DrapRegistrationProbe[] {
  const unique = new Map<string, DrapRegistrationProbe>();

  for (const registration of registrations) {
    const normalized = canonicalizeRegistrationNumber(registration.registrationNumber);
    if (!normalized) {
      continue;
    }

    if (!unique.has(normalized)) {
      unique.set(normalized, {
        registrationNumber: normalized,
        sourceUrl: registration.sourceUrl,
      });
    }

    if (includeLegacyVariants) {
      for (const variant of buildLegacyVariants(normalized, registration.sourceUrl)) {
        const canonical = canonicalizeRegistrationNumber(variant.registrationNumber);
        if (!unique.has(canonical)) {
          unique.set(canonical, variant);
        }
      }
    }
  }

  return Array.from(unique.values());
}

function buildLegacyVariants(
  registrationNumber: string,
  sourceUrl?: string,
): DrapRegistrationProbe[] {
  const compact = registrationNumber.replace(/\s+/g, "");
  return [
    { registrationNumber: compact, sourceUrl },
    { registrationNumber: `REG.NO. ${compact}`, sourceUrl },
    { registrationNumber: `REG NO. ${compact}`, sourceUrl },
    { registrationNumber: `EX-${compact}`, sourceUrl },
    { registrationNumber: `${compact}-EX`, sourceUrl },
  ];
}

function parseRegistrationNumber(value: string): { numeric: number; width: number } {
  const numeric = Number.parseInt(String(value || "").replace(/[^0-9]/g, ""), 10);
  const width = Math.max(6, String(value || "").replace(/[^0-9]/g, "").length || 6);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { numeric: 1, width: 6 };
  }

  return { numeric, width };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toRecord(value: Prisma.InputJsonValue | undefined): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
