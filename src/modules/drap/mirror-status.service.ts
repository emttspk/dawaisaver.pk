import { Injectable } from "@nestjs/common";
import { Prisma, ImportBatchStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  DrapAcquisitionCheckpoint,
  DrapAcquisitionMetrics,
  DrapArchiveManifest,
  DrapMirrorStatusResponse,
  DrapMirrorDiagnosticsResponse,
} from "./drap.types";
import { getMirrorRuntimeState } from "./drap.freeze";

interface MirrorBatchRow {
  id: string;
  status: ImportBatchStatus;
  totalRows: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: Prisma.JsonValue | null;
  importReport: Prisma.JsonValue | null;
}

@Injectable()
export class DrapMirrorStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async getMirrorStatus(): Promise<DrapMirrorStatusResponse> {
    const batches = await this.prisma.importBatch.findMany({
      where: { adapterType: "drap-mirror" },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        status: true,
        totalRows: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
        importReport: true,
      },
    });

    const latest = batches[0] as MirrorBatchRow | undefined;
    if (!latest) {
      return this.emptyStatus();
    }

    const runId = this.extractRunId(latest);
    const runBatches = runId
      ? batches.filter((batch) => this.extractRunId(batch as MirrorBatchRow) === runId)
      : this.fallbackCurrentRun(batches as MirrorBatchRow[]);

    const activeBatches = (runBatches.length > 0 ? runBatches : [latest]).map((batch) => batch as MirrorBatchRow);
    const snapshots = activeBatches.map((batch) => this.snapshot(batch));

    const startedAt = snapshots
      .map((snapshot) => snapshot.startedAt)
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => left.getTime() - right.getTime())[0];
    const totalRows = activeBatches.reduce((sum, batch) => sum + Number(batch.totalRows || 0), 0);
    const processedCount = snapshots.reduce((sum, snapshot) => sum + snapshot.checkpoint.processed, 0);
    const successCount = snapshots.reduce((sum, snapshot) => sum + snapshot.checkpoint.parsed, 0);
    const failedCount = snapshots.reduce((sum, snapshot) => sum + snapshot.checkpoint.failed, 0);
    const duplicateCount = snapshots.reduce((sum, snapshot) => sum + snapshot.checkpoint.duplicate, 0);
    const retries = snapshots.reduce((sum, snapshot) => sum + snapshot.checkpoint.retries, 0);
    const archiveUploads = snapshots.reduce((sum, snapshot) => sum + snapshot.archive.uploadedSegments, 0);
    const workerCount = Math.max(
      snapshots.reduce((max, snapshot) => Math.max(max, snapshot.workerCount || 0), 0),
      activeBatches.length,
    );
    const referenceSnapshot = snapshots
      .slice()
      .sort((left, right) => right.checkpoint.processed - left.checkpoint.processed || right.updatedAt.getTime() - left.updatedAt.getTime())[0];
    const elapsedMs = startedAt ? Math.max(Date.now() - startedAt.getTime(), 1) : 1;
    const throughput = processedCount > 0 ? processedCount / (elapsedMs / 1000) : 0;
    const remainingRows = Math.max(totalRows - processedCount, 0);
    const etaSeconds = throughput > 0 ? remainingRows / throughput : undefined;
    const etaAt = etaSeconds && startedAt ? new Date(startedAt.getTime() + etaSeconds * 1000).toISOString() : undefined;
    const checkpointIntegrity = snapshots.every((snapshot) => snapshot.checkpoint.nextIndex <= snapshot.totalRows)
      ? "healthy"
      : "degraded";
    const archiveIntegrity = snapshots.every((snapshot) => snapshot.archive.totalSegments >= snapshot.archive.uploadedSegments)
      ? "healthy"
      : "degraded";
    const r2Integrity = snapshots.every((snapshot) => snapshot.r2Status.missing.length === 0)
      ? "healthy"
      : snapshots.some((snapshot) => snapshot.r2Status.missing.length > 0)
        ? "degraded"
        : "unknown";
    const status = this.aggregateStatus(activeBatches.map((batch) => batch.status));
    const successRate = processedCount > 0 ? (successCount / processedCount) * 100 : 0;
    const operationalState = await getMirrorRuntimeState();

    return {
      status: operationalState === "PAUSED" ? "PAUSED" : (status as DrapMirrorStatusResponse["status"]),
      started_at: startedAt?.toISOString(),
      completed_at:
        snapshots.every((snapshot) => snapshot.status === "COMPLETED" || snapshot.status === "COMPLETED_WITH_ERRORS")
          ? snapshots
              .map((snapshot) => snapshot.completedAt)
              .filter((value): value is Date => Boolean(value))
              .sort((left, right) => right.getTime() - left.getTime())[0]
              ?.toISOString()
          : undefined,
      processed_count: processedCount,
      success_count: successCount,
      failed_count: failedCount,
      retries,
      duplicates: duplicateCount,
      throughput: round(throughput),
      worker_count: workerCount,
      last_registration: referenceSnapshot?.checkpoint.lastRegistrationNumber,
      eta_seconds: etaSeconds ? round(etaSeconds) : undefined,
      eta_at: etaAt,
      archive_uploads: archiveUploads,
      run_id: runId,
      total_rows: totalRows,
      success_rate: round(successRate),
      checkpoint_integrity: checkpointIntegrity,
      archive_integrity: archiveIntegrity,
      r2_integrity: r2Integrity,
      batches: snapshots.map((snapshot) => ({
        batch_id: snapshot.batchId,
        status: snapshot.status,
        started_at: snapshot.startedAt?.toISOString(),
        processed_count: snapshot.checkpoint.processed,
        success_count: snapshot.checkpoint.parsed,
        failed_count: snapshot.checkpoint.failed,
        retries: snapshot.checkpoint.retries,
        duplicates: snapshot.checkpoint.duplicate,
        worker_id: snapshot.workerId,
        mirror_run_id: snapshot.mirrorRunId,
        last_registration: snapshot.checkpoint.lastRegistrationNumber,
        archive_uploads: snapshot.archive.uploadedSegments,
        throughput: round(snapshot.throughput),
        eta_seconds: snapshot.etaSeconds ? round(snapshot.etaSeconds) : undefined,
        updated_at: snapshot.updatedAt.toISOString(),
      })),
    };
  }

  private snapshot(batch: MirrorBatchRow) {
    const checkpoint = this.extractCheckpoint(batch);
    const archive = this.extractArchive(batch);
    const r2Status = this.extractR2Status(batch);
    const workerCount = this.extractWorkerCount(batch);
    const mirrorRunId = this.extractRunId(batch);
    const startedAt = batch.startedAt ?? batch.createdAt;
    const elapsedMs = Math.max(Date.now() - startedAt.getTime(), 1);
    const throughput = checkpoint.processed > 0 ? checkpoint.processed / (elapsedMs / 1000) : 0;
    const etaSeconds = throughput > 0 ? Math.max(batch.totalRows - checkpoint.processed, 0) / throughput : undefined;

    return {
      batchId: batch.id,
      status: batch.status,
      startedAt,
      checkpoint,
      archive,
      r2Status,
      workerCount,
      workerId: this.extractWorkerId(batch),
      mirrorRunId,
      throughput,
      etaSeconds,
      updatedAt: batch.updatedAt,
      completedAt: batch.finishedAt ?? undefined,
      totalRows: batch.totalRows,
    };
  }

  private extractRunId(batch: MirrorBatchRow): string | undefined {
    const metadata = toRecord(batch.metadata);
    const acquisition = toRecord(metadata.acquisition);
    const runId = acquisition.mirrorRunId;
    return typeof runId === "string" && runId.trim() ? runId : undefined;
  }

  private extractWorkerCount(batch: MirrorBatchRow): number | undefined {
    const metadata = toRecord(batch.metadata);
    const acquisition = toRecord(metadata.acquisition);
    const value = acquisition.workerCount;
    return normalizeNumber(value);
  }

  private extractWorkerId(batch: MirrorBatchRow): number | undefined {
    const metadata = toRecord(batch.metadata);
    const acquisition = toRecord(metadata.acquisition);
    const value = acquisition.workerId;
    return normalizeNumber(value);
  }

  private extractCheckpoint(batch: MirrorBatchRow): DrapAcquisitionCheckpoint {
    const metadata = toRecord(batch.metadata);
    const acquisition = toRecord(metadata.acquisition);
    const checkpoint = toRecord(acquisition.checkpoint);
    const report = toRecord(batch.importReport);
    const reportCheckpoint = toRecord(report.checkpoint);
    return {
      batchId: stringValue(checkpoint.batchId) || stringValue(reportCheckpoint.batchId) || batch.id,
      nextIndex: numberValue(checkpoint.nextIndex) ?? numberValue(reportCheckpoint.nextIndex) ?? 0,
      lastRegistrationNumber:
        stringValue(checkpoint.lastRegistrationNumber) || stringValue(reportCheckpoint.lastRegistrationNumber) || undefined,
      processed: numberValue(checkpoint.processed) ?? numberValue(reportCheckpoint.processed) ?? 0,
      fetched: numberValue(checkpoint.fetched) ?? numberValue(reportCheckpoint.fetched) ?? 0,
      parsed: numberValue(checkpoint.parsed) ?? numberValue(reportCheckpoint.parsed) ?? 0,
      failed: numberValue(checkpoint.failed) ?? numberValue(reportCheckpoint.failed) ?? 0,
      duplicate: numberValue(checkpoint.duplicate) ?? numberValue(reportCheckpoint.duplicate) ?? 0,
      retries: numberValue(checkpoint.retries) ?? numberValue(reportCheckpoint.retries) ?? 0,
    };
  }

  private extractArchive(batch: MirrorBatchRow): DrapArchiveManifest {
    const metadata = toRecord(batch.metadata);
    const acquisition = toRecord(metadata.acquisition);
    const archive = toRecord(acquisition.archive);
    const report = toRecord(batch.importReport);
    const reportArchive = toRecord(report.archive);
    const value = (archive.strategy === "batched_gzip" ? archive : reportArchive) as Record<string, unknown>;
    return {
      strategy: "batched_gzip",
      batchSize: numberValue(value.batchSize) ?? 0,
      fallbackBatchSize: numberValue(value.fallbackBatchSize) ?? 0,
      spoolDir: stringValue(value.spoolDir) || "",
      nextSequence: numberValue(value.nextSequence) ?? 0,
      totalRecords: numberValue(value.totalRecords) ?? 0,
      totalSegments: numberValue(value.totalSegments) ?? 0,
      uploadedSegments: numberValue(value.uploadedSegments) ?? 0,
      failedSegments: numberValue(value.failedSegments) ?? 0,
      pendingSegments: numberValue(value.pendingSegments) ?? 0,
      totalRawBytes: numberValue(value.totalRawBytes) ?? 0,
      totalCompressedBytes: numberValue(value.totalCompressedBytes) ?? 0,
      segments: Array.isArray(value.segments) ? (value.segments as DrapArchiveManifest["segments"]) : [],
    };
  }

  private extractR2Status(batch: MirrorBatchRow) {
    const metadata = toRecord(batch.metadata);
    const acquisition = toRecord(metadata.acquisition);
    const r2Status = toRecord(acquisition.r2Status);
    const report = toRecord(batch.importReport);
    const reportR2Status = toRecord(report.r2Status);
    const source = Object.keys(r2Status).length > 0 ? r2Status : reportR2Status;
    const required = Array.isArray(source.required) ? source.required.map(String) : [];
    const missing = Array.isArray(source.missing) ? source.missing.map(String) : [];
    const present = Array.isArray(source.present) ? source.present.map(String) : [];
    return { required, missing, present };
  }

  private aggregateStatus(statuses: ImportBatchStatus[]): DrapMirrorStatusResponse["status"] {
    if (statuses.some((status) => status === "RUNNING" || status === "PENDING")) {
      return "RUNNING";
    }
    if (statuses.some((status) => status === "FAILED")) {
      return "FAILED";
    }
    if (statuses.some((status) => status === "COMPLETED_WITH_ERRORS")) {
      return "COMPLETED_WITH_ERRORS";
    }
    if (statuses.every((status) => status === "COMPLETED")) {
      return "COMPLETED";
    }
    return "PENDING";
  }

  private fallbackCurrentRun(batches: MirrorBatchRow[]): MirrorBatchRow[] {
    const latest = batches[0];
    if (!latest) return [];
    
    const latestStatus = latest.status;
    const isLatestRunning = latestStatus === "RUNNING" || latestStatus === "PENDING";
    
    if (isLatestRunning) {
      return [latest];
    }
    
    const anchor = latest.startedAt ?? latest.createdAt;
    const windowMs = isLatestRunning ? 15 * 60 * 1000 : 5 * 60 * 1000;
    
    return batches.filter((batch) => {
      if (batch.status === "RUNNING" || batch.status === "PENDING") {
        return true;
      }
      const startedAt = batch.startedAt ?? batch.createdAt;
      return Math.abs(startedAt.getTime() - anchor.getTime()) <= windowMs;
    });
  }

  private async emptyStatus(): Promise<DrapMirrorStatusResponse> {
    return {
      status: (await getMirrorRuntimeState()) === "PAUSED" ? "PAUSED" : "PENDING",
      processed_count: 0,
      success_count: 0,
      failed_count: 0,
      retries: 0,
      duplicates: 0,
      throughput: 0,
      worker_count: 0,
      archive_uploads: 0,
      total_rows: 0,
      success_rate: 0,
      checkpoint_integrity: "unknown",
      archive_integrity: "unknown",
      r2_integrity: "unknown",
      batches: [],
    };
  }

  async getMirrorDiagnostics(): Promise<DrapMirrorDiagnosticsResponse> {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const staleBatches = await this.prisma.importBatch.findMany({
      where: {
        adapterType: "drap-mirror",
        status: "RUNNING",
        startedAt: {
          lt: staleThreshold,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        startedAt: true,
        metadata: true,
      },
    });

    const allRunningBatches = await this.prisma.importBatch.count({
      where: {
        adapterType: "drap-mirror",
        status: "RUNNING",
      },
    });

    const lastSuccessful = await this.prisma.importBatch.findFirst({
      where: {
        adapterType: "drap-mirror",
        status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS"] },
      },
      orderBy: { finishedAt: "desc" },
      select: {
        id: true,
        finishedAt: true,
        metadata: true,
        importReport: true,
      },
    });

    const latestRunning = await this.prisma.importBatch.findFirst({
      where: {
        adapterType: "drap-mirror",
        status: "RUNNING",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        metadata: true,
        importReport: true,
      },
    });

    const activeWorkers = latestRunning?.metadata && typeof latestRunning.metadata === "object" 
      ? Number(((latestRunning.metadata as Record<string, unknown>).acquisition as Record<string, unknown>)?.workerCount) || 0 
      : 0;
    const currentRegistration = this.extractLastRegistration(latestRunning?.metadata);
    const lastCheckpoint = this.extractCheckpointFromMetadata(latestRunning?.metadata, latestRunning?.importReport);
    
    const archive = latestRunning?.importReport && typeof latestRunning.importReport === "object"
      ? (latestRunning.importReport as Record<string, unknown>).archive as Record<string, unknown> | undefined
      : undefined;
    
    const archiveStatus = archive ? {
      totalSegments: Number(archive.totalSegments) || 0,
      uploadedSegments: Number(archive.uploadedSegments) || 0,
      failedSegments: Number(archive.failedSegments) || 0,
      pendingSegments: Number(archive.pendingSegments) || 0,
      failedSegmentDetails: Array.isArray((archive.segments as unknown[]) || [])
        ? (archive.segments as Array<Record<string, unknown>>).filter((s) => s.status === "FAILED").map((s) => ({
            segmentId: String(s.segmentId || ""),
            fileName: String(s.fileName || ""),
            errorMessage: typeof s.errorMessage === "string" ? s.errorMessage : undefined,
          }))
        : [],
    } : { totalSegments: 0, uploadedSegments: 0, failedSegments: 0, pendingSegments: 0, failedSegmentDetails: [] };

    const warnings: string[] = [];
    if (allRunningBatches > 0) {
      warnings.push(`${allRunningBatches} batches in RUNNING state - check for stuck workers`);
    }
    if (staleBatches.length > 0) {
      warnings.push(`${staleBatches.length} stale batches older than 24h detected`);
    }
    if (archiveStatus.failedSegments > 0) {
      warnings.push(`${archiveStatus.failedSegments} archive segments failed - check R2 connectivity`);
    }

    const workerHeartbeat = latestRunning?.metadata && typeof latestRunning.metadata === "object"
      ? this.extractWorkerHeartbeat(latestRunning.metadata as Record<string, unknown>)
      : undefined;

    return {
      activeWorkers,
      currentRegistration,
      lastCheckpoint,
      lastSuccessfulBatch: lastSuccessful
        ? {
            batchId: lastSuccessful.id,
            completedAt: lastSuccessful.finishedAt?.toISOString() || "",
            processed: lastSuccessful.metadata && typeof lastSuccessful.metadata === "object"
              ? Number((((lastSuccessful.metadata as Record<string, unknown>).acquisition as Record<string, unknown>)?.checkpoint as Record<string, unknown>)?.processed) || 0
              : 0,
          }
        : undefined,
      staleBatchCount: staleBatches.length,
      staleBatches: staleBatches.map((batch) => {
        const startedAt = batch.startedAt || now;
        const ageHours = startedAt ? Math.round((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60)) : 0;
        return {
          batchId: batch.id,
          startedAt: startedAt.toISOString(),
          checkpoint: this.extractCheckpointFromMetadata(batch.metadata, null) || {
            batchId: batch.id,
            nextIndex: 0,
            lastRegistrationNumber: undefined,
            processed: 0,
            fetched: 0,
            parsed: 0,
            failed: 0,
            duplicate: 0,
            retries: 0,
          },
          ageHours,
        };
      }),
      warnings,
      r2Status: this.getR2Status(),
      archiveStatus,
      workerHeartbeat,
    };
  }

  private extractWorkerHeartbeat(metadata: Record<string, unknown>): { workerId?: string; lastActivityAt?: string; ageSeconds?: number } | undefined {
    const acquisition = metadata.acquisition as Record<string, unknown> | undefined;
    if (!acquisition) return undefined;
    
    const workerId = acquisition.workerId ? String(acquisition.workerId) : undefined;
    const lastActivityAt = acquisition.lastActivityAt ? String(acquisition.lastActivityAt) : undefined;
    
    if (!lastActivityAt) return { workerId };
    
    const lastActivity = new Date(lastActivityAt);
    const ageSeconds = Math.round((Date.now() - lastActivity.getTime()) / 1000);
    
    return { workerId, lastActivityAt, ageSeconds };
  }

  private getR2Status(): { configured: boolean; accountId?: string; bucketName?: string; publicBaseUrl?: string } {
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    const bucketName = process.env.R2_BUCKET_NAME?.trim();
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();
    return {
      configured: Boolean(accountId && bucketName),
      accountId,
      bucketName,
      publicBaseUrl,
    };
  }

  private extractLastRegistration(metadata: unknown): string | undefined {
    const record = toRecord(metadata);
    const acquisition = toRecord(record.acquisition);
    return stringValue(acquisition.lastRegistrationNumber);
  }

  private extractCheckpointFromMetadata(metadata: unknown, importReport: unknown): DrapAcquisitionCheckpoint | undefined {
    const metaRecord = toRecord(metadata);
    const metaCheckpoint = toRecord(metaRecord.acquisition)?.checkpoint;
    const reportRecord = toRecord(importReport);
    const reportCheckpoint = toRecord(reportRecord.checkpoint);
    const checkpoint = metaCheckpoint || reportCheckpoint;
    if (!checkpoint || typeof checkpoint !== "object") return undefined;
    return {
      batchId: stringValue((checkpoint as Record<string, unknown>).batchId),
      nextIndex: numberValue((checkpoint as Record<string, unknown>).nextIndex) ?? 0,
      lastRegistrationNumber: stringValue((checkpoint as Record<string, unknown>).lastRegistrationNumber),
      processed: numberValue((checkpoint as Record<string, unknown>).processed) ?? 0,
      fetched: numberValue((checkpoint as Record<string, unknown>).fetched) ?? 0,
      parsed: numberValue((checkpoint as Record<string, unknown>).parsed) ?? 0,
      failed: numberValue((checkpoint as Record<string, unknown>).failed) ?? 0,
      duplicate: numberValue((checkpoint as Record<string, unknown>).duplicate) ?? 0,
      retries: numberValue((checkpoint as Record<string, unknown>).retries) ?? 0,
    };
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  return numberValue(value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
