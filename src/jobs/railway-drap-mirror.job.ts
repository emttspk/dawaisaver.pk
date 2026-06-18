import { Logger } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { UploadService } from "../modules/ocr/upload.service";
import { DrapAcquisitionService } from "../modules/drap/drap.acquisition.service";
import { DrapAcquisitionCheckpoint, DrapAcquisitionPlan } from "../modules/drap/drap.types";

interface RailwayMirrorWorkerConfig {
  workerId: number;
  workerCount: number;
  batchId: string;
  resumeFrom?: DrapAcquisitionCheckpoint;
  completed?: boolean;
}

interface RailwayMirrorWorkerResult {
  workerId: number;
  batchId: string;
  skipped: boolean;
  completed: boolean;
  fetched: number;
  parsed: number;
  failed: number;
  duplicates: number;
  retries: number;
  runtimeMs: number;
  archiveUploads: number;
  checkpoint?: DrapAcquisitionCheckpoint;
}

export async function runRailwayDrapMirrorJob(logger = new Logger("RailwayDrapMirrorJob")): Promise<void> {
  const totalRows = Number(process.env.DRAP_MIRROR_TOTAL_REGISTRATIONS || 50000);
  const startRegistration = process.env.DRAP_MIRROR_START_REGISTRATION || "041350";
  const endRegistration = process.env.DRAP_MIRROR_END_REGISTRATION || buildEndRegistration(startRegistration, totalRows);
  const workerCount = Number(process.env.DRAP_MIRROR_WORKERS || 4);
  const runId = requireEnv("DRAP_MIRROR_RUN_ID");
  const sourceUrl = process.env.DRAP_SOURCE_URL || "https://eapp.dra.gov.pk/product_view_web.php";

  const prisma = new PrismaService();
  const acquisitionService = new DrapAcquisitionService(prisma, new UploadService());

  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;

  try {
    const r2Status = acquisitionService.verifyR2Configuration();
    logger.log(
      `Railway mirror job starting: workers=${workerCount}, totalRows=${totalRows}, range=${startRegistration}-${endRegistration}`,
    );
    logger.log(
      `R2 env status: present=${r2Status.present.join(",") || "none"} missing=${r2Status.missing.join(",") || "none"}`,
    );

    const registrations = acquisitionService.enumerateRegistrations({
      startRegistration,
      endRegistration,
    });

    if (registrations.length !== totalRows) {
      throw new Error(`Expected exactly ${totalRows} registrations, received ${registrations.length}.`);
    }

    const chunks = splitRegistrations(registrations, workerCount);
    const workerConfigs = await Promise.all(
      chunks.map(async (chunk, index) => {
        const workerId = index + 1;
        const batchId = stableUuid(`${runId}:worker:${workerId}`);
        const existing = await prisma.importBatch.findUnique({
          where: { id: batchId },
          select: {
            status: true,
            metadata: true,
            importReport: true,
          },
        });
        const checkpoint = extractCheckpoint(existing?.metadata, existing?.importReport);
        const completed =
          Boolean(existing?.status === "COMPLETED" || existing?.status === "COMPLETED_WITH_ERRORS") &&
          Boolean(checkpoint && checkpoint.nextIndex >= chunk.length);

        return {
          workerId,
          workerCount,
          batchId,
          resumeFrom: completed ? checkpoint : checkpoint,
          completed,
          registrations: chunk,
        } as RailwayMirrorWorkerConfig & { registrations: Array<{ registrationNumber: string }> };
      }),
    );

    const startWall = performance.now();
    const results = await Promise.all(
      workerConfigs.map(async (workerConfig) => {
        const startedAt = performance.now();
        const memoryStart = process.memoryUsage().rss;

        if (workerConfig.completed) {
          logger.log(
            `Worker ${workerConfig.workerId} already complete for batch ${workerConfig.batchId}; skipping resume.`,
          );
          return {
            workerId: workerConfig.workerId,
            batchId: workerConfig.batchId,
            skipped: true,
            completed: true,
            fetched: 0,
            parsed: 0,
            failed: 0,
            duplicates: 0,
            retries: 0,
            runtimeMs: 0,
            archiveUploads: 0,
            checkpoint: workerConfig.resumeFrom,
          } satisfies RailwayMirrorWorkerResult;
        }

        const plan: DrapAcquisitionPlan = {
          batchId: workerConfig.batchId,
          sourceUrl,
          registrations: workerConfig.registrations,
          maxRetries: Number(process.env.DRAP_MIRROR_MAX_RETRIES || 3),
          checkpointEvery: Number(process.env.DRAP_MIRROR_CHECKPOINT_EVERY || 50),
          archiveStrategy: "batched",
          archiveBatchSize: Number(process.env.DRAP_MIRROR_ARCHIVE_BATCH_SIZE || 1000),
          archiveFallbackBatchSize: Number(process.env.DRAP_MIRROR_ARCHIVE_FALLBACK_BATCH_SIZE || 500),
          archiveUploadConcurrency: Number(process.env.DRAP_MIRROR_ARCHIVE_UPLOAD_CONCURRENCY || 4),
          archiveSpoolDir: process.env.DRAP_MIRROR_ARCHIVE_SPOOL_DIR,
          resumeFrom: workerConfig.resumeFrom,
        };

        logger.log(
          `Worker ${workerConfig.workerId}/${workerConfig.workerCount} starting batch ${workerConfig.batchId} with ${workerConfig.registrations.length} registrations`,
        );

        const result = await acquisitionService.runMirrorAcquisition(plan);
        const memoryEnd = process.memoryUsage().rss;
        const runtimeMs = performance.now() - startedAt;

        logger.log(
          `Worker ${workerConfig.workerId} finished batch ${workerConfig.batchId}: fetched=${result.fetchedRows}, parsed=${result.parsedRows}, failed=${result.failedRows}, retries=${result.retryCount}, runtimeMs=${round(runtimeMs)}, memoryDeltaMb=${round((memoryEnd - memoryStart) / 1024 / 1024)}`,
        );
        return {
          workerId: workerConfig.workerId,
          batchId: workerConfig.batchId,
          skipped: false,
          completed: result.status === "COMPLETED" || result.status === "COMPLETED_WITH_ERRORS",
          fetched: result.fetchedRows,
          parsed: result.parsedRows,
          failed: result.failedRows,
          duplicates: result.duplicateRows,
          retries: result.retryCount,
          runtimeMs,
          archiveUploads: result.metrics?.totalArchiveSegments || 0,
          checkpoint: result.checkpoint,
        } satisfies RailwayMirrorWorkerResult;
      }),
    );

    const totals = results.reduce(
      (acc, result) => {
        acc.fetched += result.fetched;
        acc.parsed += result.parsed;
        acc.failed += result.failed;
        acc.duplicates += result.duplicates;
        acc.retries += result.retries;
        acc.runtimeMs += result.runtimeMs;
        acc.archiveUploads += result.archiveUploads;
        acc.completed += result.completed ? 1 : 0;
        acc.skipped += result.skipped ? 1 : 0;
        return acc;
      },
      {
        fetched: 0,
        parsed: 0,
        failed: 0,
        duplicates: 0,
        retries: 0,
        runtimeMs: 0,
        archiveUploads: 0,
        completed: 0,
        skipped: 0,
      },
    );

    const successRate = totals.fetched > 0 ? (totals.parsed / totals.fetched) * 100 : 0;
    const throughput = totals.runtimeMs > 0 ? totals.fetched / (totals.runtimeMs / 1000) : 0;
    const projected150kHours = throughput > 0 ? 150000 / throughput / 3600 : 0;

    logger.log(
      JSON.stringify(
        {
          runId,
          workerCount,
          totalRows,
          totals,
          successRate: round(successRate),
          throughput: round(throughput),
          projected150kHours: round(projected150kHours),
          wallClockMs: round(performance.now() - startWall),
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

function splitRegistrations(
  registrations: Array<{ registrationNumber: string }>,
  workerCount: number,
): Array<Array<{ registrationNumber: string }>> {
  const chunkSize = Math.ceil(registrations.length / workerCount);
  const chunks: Array<Array<{ registrationNumber: string }>> = [];

  for (let index = 0; index < workerCount; index += 1) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, registrations.length);
    chunks.push(registrations.slice(start, end));
  }

  return chunks;
}

function extractCheckpoint(
  metadata: Prisma.InputJsonValue | null | undefined,
  importReport: Prisma.InputJsonValue | null | undefined,
): DrapAcquisitionCheckpoint | undefined {
  const metadataRecord = toRecord(metadata);
  const metadataCheckpoint = toRecord(metadataRecord.acquisition as Prisma.InputJsonValue | null | undefined)
    .checkpoint as DrapAcquisitionCheckpoint | undefined;
  if (metadataCheckpoint) {
    return metadataCheckpoint;
  }

  const reportRecord = toRecord(importReport);
  return reportRecord.checkpoint as DrapAcquisitionCheckpoint | undefined;
}

function buildEndRegistration(startRegistration: string, totalRows: number): string {
  const numeric = Number.parseInt(startRegistration.replace(/\D/g, ""), 10) || 1;
  return String(numeric + totalRows - 1).padStart(6, "0");
}

function stableUuid(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  const variant = parseInt(hex[16] || "8", 16);
  hex[16] = ((variant & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20, 32).join("")}`;
}

function toRecord(value: Prisma.InputJsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
