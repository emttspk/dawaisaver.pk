import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { UploadService } from "../ocr/upload.service";
import { assertMirrorExecutionAllowed } from "./drap.freeze";
import { canonicalizeRegistrationNumber, parseDrapMirrorPage } from "./drap.detail-parser";
import { DrapArchiveManager } from "./drap.archive";
import {
  DrapAcquisitionMetrics,
  DrapAcquisitionCheckpoint,
  DrapAcquisitionPlan,
  DrapAcquisitionR2Status,
  DrapArchiveManifest,
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

interface DrapBatchContext {
  id: string;
  metadata: Prisma.InputJsonValue | null;
  importReport: Prisma.InputJsonValue | null;
}

@Injectable()
export class DrapAcquisitionService {
  private readonly logger = new Logger(DrapAcquisitionService.name);
  private readonly uploadService: UploadService;

  constructor(private readonly prisma: PrismaService, uploadService: UploadService) {
    this.uploadService = uploadService;
  }

  verifyR2Configuration(): DrapAcquisitionR2Status {
    const required = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
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
    await assertMirrorExecutionAllowed(plan.forceExecution ? { bypass: true } : undefined);
    const r2Status = this.verifyR2Configuration();
    const registrations = this.normalizePlan(plan);
    const checkpoint = this.resolveCheckpoint(plan, registrations.length);
    const batch = await this.ensureBatch(plan, registrations.length, r2Status, checkpoint);

    let fetchedRows = checkpoint.fetched;
    let parsedRows = checkpoint.parsed;
    let failedRows = checkpoint.failed;
    let duplicateRows = checkpoint.duplicate;
    let retryCount = checkpoint.retries;
    let archiveWriteTimeTotal = 0;
    let archiveWriteCount = 0;
    let htmlSizeTotal = 0;
    let crawlStartedAt = performance.now();

    try {
      const archiveStrategy = plan.archiveStrategy || "batched";
      const archiveBatchSize = Math.max(
        1,
        plan.archiveBatchSize || (checkpoint.nextIndex > 0 ? plan.archiveFallbackBatchSize || 500 : 1000),
      );
      const archiveFallbackBatchSize = Math.max(1, plan.archiveFallbackBatchSize || 500);
      const archiveUploadConcurrency = Math.max(1, plan.archiveUploadConcurrency || 2);
      const archiveManifest = archiveStrategy === "batched" ? this.extractArchiveManifest(batch) : undefined;
      const archiveManager =
        archiveStrategy === "batched"
          ? await DrapArchiveManager.fromExisting({
              batchId: batch.id,
              uploadService: this.uploadService,
              batchSize: archiveBatchSize,
              fallbackBatchSize: archiveFallbackBatchSize,
              uploadConcurrency: archiveUploadConcurrency,
              spoolDir: plan.archiveSpoolDir,
              sourceUrl: plan.sourceUrl || "https://eapp.dra.gov.pk/product_view_web.php",
              existingManifest: archiveManifest,
            })
          : undefined;
      const seen = new Set<string>();
      const items: DrapMirrorImportItem[] = [];

      const checkpointEvery = Math.max(1, plan.checkpointEvery || 25);
      let fetchTimeTotal = 0;
      let parseTimeTotal = 0;
      let dbWriteTimeTotal = 0;
      let archiveTotalWriteTime = archiveManager ? archiveManager.getArchiveWriteTotal() : 0;
      let archiveTotalWriteCount = archiveManager ? archiveManager.getArchiveWriteCount() : 0;
      htmlSizeTotal = 0;
      crawlStartedAt = performance.now();

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
      fetchTimeTotal += fetchResult.fetchTimeMs;
      const htmlHash = createHash("sha256").update(fetchResult.html, "utf8").digest("hex");
      const htmlSizeBytes = Buffer.byteLength(fetchResult.html, "utf8");
      htmlSizeTotal += htmlSizeBytes;

      fetchedRows += 1;
      const parseStartedAt = performance.now();

      try {
        const parsed = parseDrapMirrorPage(fetchResult.html, fetchResult.finalUrl || fetchResult.requestUrl);
        const parseTimeMs = performance.now() - parseStartedAt;
        parseTimeTotal += parseTimeMs;
        parsedRows += 1;

        const dbStartedAt = performance.now();
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
            archiveStrategy,
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
              archiveStrategy,
            },
          } as unknown as Prisma.InputJsonValue,
        });
        const dbWriteTimeMs = performance.now() - dbStartedAt;
        dbWriteTimeTotal += dbWriteTimeMs;
        items.push(item);

        if (archiveManager) {
          const flushResult = await archiveManager.append({
            rowNumber: index + 1,
            registrationNumber: parsed.registrationNumber,
            requestUrl: fetchResult.requestUrl,
            finalUrl: fetchResult.finalUrl,
            httpStatus: fetchResult.httpStatus,
            rawHtml: fetchResult.html,
            htmlHash,
            status: "PARSED",
            retryCount: fetchResult.attempts - 1,
            fetchTimeMs: round(fetchResult.fetchTimeMs),
            parseTimeMs: round(parseTimeMs),
            dbWriteTimeMs: round(dbWriteTimeMs),
            htmlSizeBytes,
            parsed,
            sourceUrl: plan.sourceUrl || fetchResult.finalUrl || fetchResult.requestUrl,
          });
          archiveWriteTimeTotal += flushResult.archiveWriteTimeMs;
          if (flushResult.archiveWriteTimeMs > 0) {
            archiveWriteCount += 1;
          }
        }
      } catch (error) {
        const parseTimeMs = performance.now() - parseStartedAt;
        parseTimeTotal += parseTimeMs;
        failedRows += 1;
        const message = error instanceof Error ? error.message : "Failed to parse DRAP detail page.";

        const dbStartedAt = performance.now();
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
            archiveStrategy,
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
              archiveStrategy,
            },
          } as unknown as Prisma.InputJsonValue,
          errorMessage: message,
        });
        const dbWriteTimeMs = performance.now() - dbStartedAt;
        dbWriteTimeTotal += dbWriteTimeMs;
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
              archiveStrategy,
              htmlHash,
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

        if (archiveManager) {
          const flushResult = await archiveManager.append({
            rowNumber: index + 1,
            registrationNumber: probe.registrationNumber,
            requestUrl: fetchResult.requestUrl,
            finalUrl: fetchResult.finalUrl,
            httpStatus: fetchResult.httpStatus,
            rawHtml: fetchResult.html,
            htmlHash,
            status: "FAILED",
            retryCount: fetchResult.attempts - 1,
            fetchTimeMs: round(fetchResult.fetchTimeMs),
            parseTimeMs: round(parseTimeMs),
            dbWriteTimeMs: round(dbWriteTimeMs),
            htmlSizeBytes,
            errorMessage: message,
            sourceUrl: plan.sourceUrl || fetchResult.finalUrl || fetchResult.requestUrl,
          });
          archiveWriteTimeTotal += flushResult.archiveWriteTimeMs;
          if (flushResult.archiveWriteTimeMs > 0) {
            archiveWriteCount += 1;
          }
        }
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
        await this.persistBatchState(batch, checkpointState, r2Status, archiveManager?.getManifest());
      }
    }

    if (archiveManager) {
      await archiveManager.finalize();
      archiveWriteTimeTotal = archiveManager.getArchiveWriteTotal();
      archiveWriteCount = archiveManager.getArchiveWriteCount();
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
    const archiveState = archiveManager?.getManifest();
    const metrics = this.buildMetrics({
      fetched: fetchedRows,
      parsed: parsedRows,
      failed: failedRows,
      duplicates: duplicateRows,
      retries: retryCount,
      totalRuntimeMs: performance.now() - crawlStartedAt,
      fetchTimeTotal,
      parseTimeTotal,
      dbWriteTimeTotal,
      archiveWriteTotal: archiveWriteTimeTotal,
      archiveWriteCount,
      r2UploadTotal: archiveManager ? archiveManager.getUploadLatencyTotal() : 0,
      r2UploadCount: archiveManager ? archiveManager.getUploadCount() : 0,
      htmlSizeTotal,
      htmlCount: fetchedRows,
      archiveState,
    });

    await this.persistBatchState(batch, checkpointState, r2Status, archiveState, metrics);
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
          archive: archiveState,
          metrics,
          items,
        } as unknown as Prisma.InputJsonValue,
        metadata: {
          acquisition: {
            batchId: batch.id,
            checkpoint: checkpointState,
            r2Status,
            archive: archiveState,
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
      archive: archiveState,
      metrics,
      items,
    };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during mirror acquisition";
      this.logger.error(`Mirror acquisition failed for batch ${batch.id}: ${errorMessage}`);

      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: "COMPLETED_WITH_ERRORS",
          finishedAt: new Date(),
          importReport: {
            batchId: batch.id,
            status: "COMPLETED_WITH_ERRORS",
            totalRows: registrations.length,
            fetchedRows,
            parsedRows,
            failedRows: failedRows + 1,
            duplicateRows,
            checkpoint: this.buildCheckpoint({
              batchId: batch.id,
              nextIndex: checkpoint.nextIndex,
              lastRegistrationNumber: checkpoint.lastRegistrationNumber,
              processed: checkpoint.processed,
              fetched: fetchedRows,
              parsed: parsedRows,
              failed: failedRows + 1,
              duplicate: duplicateRows,
              retries: retryCount,
            }),
            r2Status,
            errorMessage,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      throw error;
    }
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
  ): Promise<DrapBatchContext> {
    if (plan.batchId) {
      const existing = await this.prisma.importBatch.findUnique({
        where: { id: plan.batchId },
        select: {
          id: true,
          metadata: true,
          importReport: true,
        },
      });

      if (existing) {
        return {
          id: existing.id,
          metadata: (existing.metadata as Prisma.InputJsonValue | null) ?? null,
          importReport: (existing.importReport as Prisma.InputJsonValue | null) ?? null,
        };
      }
    }

    const created = await this.prisma.importBatch.create({
      select: {
        id: true,
        metadata: true,
        importReport: true,
      },
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
            mirrorRunId: plan.mirrorRunId,
            workerId: plan.workerId,
            workerCount: plan.workerCount,
            mode: "drap-mirror",
            checkpoint,
            r2Status,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: created.id,
      metadata: (created.metadata as Prisma.InputJsonValue | null) ?? null,
      importReport: (created.importReport as Prisma.InputJsonValue | null) ?? null,
    };
  }

  private async persistBatchState(
    batch: DrapBatchContext,
    checkpoint: DrapAcquisitionCheckpoint,
    r2Status: DrapAcquisitionR2Status,
    archive?: DrapArchiveManifest,
    metrics?: DrapAcquisitionMetrics,
  ): Promise<void> {
    const existingMetadata = isPlainObject(batch.metadata) ? (batch.metadata as Record<string, unknown>) : {};
    const existingAcquisition = isPlainObject(existingMetadata.acquisition)
      ? (existingMetadata.acquisition as Record<string, unknown>)
      : {};

    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        metadata: {
          ...existingMetadata,
          acquisition: {
            ...existingAcquisition,
            mirrorRunId: planRunId(existingAcquisition, checkpoint.batchId),
            workerId: planWorkerId(existingAcquisition, checkpoint.batchId),
            workerCount: planWorkerCount(existingAcquisition, checkpoint.batchId),
            checkpoint,
            r2Status,
            ...(archive ? { archive } : {}),
            ...(metrics ? { metrics } : {}),
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async fetchDetailWithRetry(
    probe: DrapRegistrationProbe,
    maxRetries: number,
  ): Promise<DrapDetailFetchResult & { attempts: number; fetchTimeMs: number }> {
    const registrationNumber = canonicalizeRegistrationNumber(probe.registrationNumber);
    const requestUrl = `https://eapp.dra.gov.pk/product_view_web.php?reg_no=${encodeURIComponent(registrationNumber)}`;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= Math.max(1, maxRetries); attempt += 1) {
      try {
        const fetchStartedAt = performance.now();
        const response = await fetch(requestUrl, {
          headers: {
            "user-agent": process.env.CRAWLER_USER_AGENT || "DawaiSaverBot/0.1",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        const html = await response.text();
        const fetchTimeMs = performance.now() - fetchStartedAt;
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
          fetchTimeMs,
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
      rawHtmlUrl:
        typeof rawData.archiveUrl === "string"
          ? rawData.archiveUrl
          : typeof rawData.r2Url === "string"
            ? rawData.r2Url
            : undefined,
      parsed: item.normalizedData as unknown as DrapMirrorImportItem["parsed"],
      errorMessage: item.errorMessage,
      r2Key: typeof rawData.r2Key === "string" ? rawData.r2Key : undefined,
      archiveKey: typeof rawData.archiveKey === "string" ? rawData.archiveKey : undefined,
      archiveUrl: typeof rawData.archiveUrl === "string" ? rawData.archiveUrl : undefined,
      archiveSegmentId: typeof rawData.archiveSegmentId === "string" ? rawData.archiveSegmentId : undefined,
    };
  }

  private extractArchiveManifest(batch: DrapBatchContext): DrapArchiveManifest | undefined {
    const importReport = toRecord(batch.importReport as Prisma.InputJsonValue | undefined);
    const reportArchive = isPlainObject(importReport.archive) ? importReport.archive : undefined;
    if (reportArchive && isPlainObject(reportArchive) && reportArchive.strategy === "batched_gzip") {
      return reportArchive as unknown as DrapArchiveManifest;
    }

    const metadata = toRecord(batch.metadata as Prisma.InputJsonValue | undefined);
    const acquisition = isPlainObject(metadata.acquisition) ? metadata.acquisition : undefined;
    const metadataArchive = acquisition && isPlainObject(acquisition.archive) ? acquisition.archive : undefined;
    if (metadataArchive && isPlainObject(metadataArchive) && metadataArchive.strategy === "batched_gzip") {
      return metadataArchive as unknown as DrapArchiveManifest;
    }

    return undefined;
  }

  private buildMetrics(input: {
    fetched: number;
    parsed: number;
    failed: number;
    duplicates: number;
    retries: number;
    totalRuntimeMs: number;
    fetchTimeTotal: number;
    parseTimeTotal: number;
    dbWriteTimeTotal: number;
    archiveWriteTotal: number;
    archiveWriteCount: number;
    r2UploadTotal: number;
    r2UploadCount: number;
    htmlSizeTotal: number;
    htmlCount: number;
    archiveState?: DrapArchiveManifest;
  }): DrapAcquisitionMetrics {
    const safeDivide = (total: number, count: number): number => (count > 0 ? total / count : 0);
    return {
      fetched: input.fetched,
      parsed: input.parsed,
      failed: input.failed,
      duplicates: input.duplicates,
      retries: input.retries,
      totalRuntimeMs: round(input.totalRuntimeMs),
      avgFetchTimeMs: round(safeDivide(input.fetchTimeTotal, input.fetched)),
      avgParseTimeMs: round(safeDivide(input.parseTimeTotal, input.fetched)),
      avgDbWriteTimeMs: round(safeDivide(input.dbWriteTimeTotal, input.parsed + input.failed + input.duplicates)),
      avgArchiveWriteTimeMs: round(safeDivide(input.archiveWriteTotal, input.archiveWriteCount)),
      avgR2BatchUploadTimeMs: round(safeDivide(input.r2UploadTotal, input.r2UploadCount)),
      avgHtmlSizeBytes: round(safeDivide(input.htmlSizeTotal, input.htmlCount)),
      totalArchiveSegments: input.archiveState?.totalSegments || 0,
      uploadedArchiveSegments: input.archiveState?.uploadedSegments || 0,
      failedArchiveSegments: input.archiveState?.failedSegments || 0,
      pendingArchiveSegments: input.archiveState?.pendingSegments || 0,
    };
  }
}

function planRunId(acquisition: Record<string, unknown>, fallback?: string): string | undefined {
  const value = acquisition.mirrorRunId;
  return typeof value === "string" && value.trim() ? value : fallback;
}

function planWorkerId(acquisition: Record<string, unknown>, fallback?: string): number | undefined {
  const value = acquisition.workerId;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  const fallbackNumber = Number.parseInt(String(fallback || ""), 10);
  return Number.isFinite(fallbackNumber) ? fallbackNumber : undefined;
}

function planWorkerCount(acquisition: Record<string, unknown>, fallback?: string): number | undefined {
  const value = acquisition.workerCount;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  const fallbackNumber = Number.parseInt(String(fallback || ""), 10);
  return Number.isFinite(fallbackNumber) ? fallbackNumber : undefined;
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

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function toRecord(value: Prisma.InputJsonValue | undefined): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
