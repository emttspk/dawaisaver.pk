import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DrapMirrorStatusService } from "./mirror-status.service";
import { DrapMirrorControlService } from "./drap-mirror-control.service";
import { DrapAcquisitionService } from "./drap.acquisition.service";
import { DrapMirrorImportSummary, DrapMirrorStatusResponse } from "./drap.types";

export interface DrapValidationRunResult {
  success: boolean;
  requested: number;
  startRegistration: string;
  endRegistration: string;
  before: DrapMirrorStatusResponse;
  after: DrapMirrorStatusResponse;
  run: DrapMirrorImportSummary;
  processedDelta: number;
  successDelta: number;
  failedDelta: number;
  successRate: number;
  archiveHealthy: boolean;
  workerHealthy: boolean;
  remainingRegistrations: number;
  estimatedRuntimeHours: number;
  estimatedStorageMb: number;
  recommendation: string;
}

@Injectable()
export class DrapValidationService {
  constructor(
    private readonly mirrorStatusService: DrapMirrorStatusService,
    private readonly controlService: DrapMirrorControlService,
    private readonly acquisitionService: DrapAcquisitionService,
  ) {}

  async runBoundedValidation(requested = 1000): Promise<DrapValidationRunResult> {
    const requestedCount = Math.max(1, Math.min(Number(requested) || 1000, 1000));
    const before = await this.mirrorStatusService.getMirrorStatus();
    const startRegistration = incrementRegistration(before.last_registration || "000000");
    const endRegistration = incrementRegistrationBy(startRegistration, requestedCount - 1);
    const registrations = this.acquisitionService.enumerateRegistrations({
      startRegistration,
      endRegistration,
    });

    if (registrations.length !== requestedCount) {
      throw new Error(`Expected ${requestedCount} registrations, received ${registrations.length}.`);
    }

    await this.controlService.resume();

    try {
        const run = await this.acquisitionService.runMirrorAcquisition({
          batchId: randomUUID(),
          mirrorRunId: `validation-${Date.now()}`,
          workerId: 1,
          workerCount: 1,
        sourceUrl: process.env.DRAP_SOURCE_URL || "https://eapp.dra.gov.pk/product_view_web.php",
          registrations,
          checkpointEvery: 25,
          archiveStrategy: "batched",
          archiveBatchSize: 250,
          archiveFallbackBatchSize: 250,
          archiveUploadConcurrency: 1,
          forceExecution: true,
        });

      const after = await this.mirrorStatusService.getMirrorStatus();
      await this.controlService.pause();

      const processedDelta = after.processed_count - before.processed_count;
      const successDelta = after.success_count - before.success_count;
      const failedDelta = after.failed_count - before.failed_count;
      const successRate = processedDelta > 0 ? (successDelta / processedDelta) * 100 : 0;
      const archiveHealthy = after.archive_integrity === "healthy" && after.r2_integrity === "healthy";
      const workerHealthy = after.worker_count > 0 && after.status !== "FAILED";
      const remainingRegistrations = Math.max(after.total_rows - after.processed_count, 0);
      const throughput = after.throughput > 0 ? after.throughput : 0.01;
      const estimatedRuntimeHours = remainingRegistrations / throughput / 3600;
      const estimatedStorageMb = Math.max(after.archive_uploads, 1) * 250;

      return {
        success: processedDelta === requestedCount && successRate >= 80 && failedDelta >= 0,
        requested: requestedCount,
        startRegistration,
        endRegistration,
        before,
        after,
        run,
        processedDelta,
        successDelta,
        failedDelta,
        successRate: round(successRate),
        archiveHealthy,
        workerHealthy,
        remainingRegistrations,
        estimatedRuntimeHours: round(estimatedRuntimeHours),
        estimatedStorageMb: round(estimatedStorageMb),
        recommendation:
          successRate >= 80 && archiveHealthy
            ? "Proceed with the full DRAP crawl in controlled worker batches."
            : "Hold the full crawl and investigate the failure ratio or archive health before continuing.",
      };
    } catch (error) {
      await this.controlService.pause();
      throw error;
    }
  }
}

function incrementRegistration(value: string): string {
  return incrementRegistrationBy(value, 1);
}

function incrementRegistrationBy(value: string, delta: number): string {
  const numeric = Number.parseInt(String(value || "").replace(/\D/g, ""), 10) || 0;
  return String(numeric + delta).padStart(6, "0");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
