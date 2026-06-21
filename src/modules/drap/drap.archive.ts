import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { promisify } from "node:util";
import { gzip as gzipCallback } from "node:zlib";
import { UploadService } from "../ocr/upload.service";
import { DrapArchiveManifest, DrapArchiveSegmentManifest, DrapMirrorParsedRecord } from "./drap.types";

const gzip = promisify(gzipCallback);

export interface DrapArchiveEntry {
  rowNumber: number;
  registrationNumber: string;
  requestUrl: string;
  finalUrl?: string;
  httpStatus: number;
  rawHtml: string;
  htmlHash: string;
  status: "PARSED" | "FAILED" | "DUPLICATE";
  retryCount: number;
  fetchTimeMs: number;
  parseTimeMs: number;
  dbWriteTimeMs: number;
  htmlSizeBytes: number;
  parsed?: DrapMirrorParsedRecord;
  errorMessage?: string;
  sourceUrl?: string;
}

export interface DrapArchiveManagerOptions {
  batchId: string;
  uploadService: UploadService;
  batchSize: number;
  fallbackBatchSize: number;
  uploadConcurrency: number;
  spoolDir?: string;
  sourceUrl?: string;
  existingManifest?: DrapArchiveManifest;
}

export interface DrapArchiveFlushResult {
  segment?: DrapArchiveSegmentManifest;
  archiveWriteTimeMs: number;
}

export class DrapArchiveManager {
  private readonly uploadService: UploadService;
  private readonly batchId: string;
  private readonly batchSize: number;
  private readonly fallbackBatchSize: number;
  private readonly uploadConcurrency: number;
  private readonly spoolDir: string;
  private readonly sourceUrl?: string;
  private readonly buffer: DrapArchiveEntry[] = [];
  private readonly uploads: Array<Promise<void>> = [];
  private readonly inFlight = new Set<Promise<void>>();
  private manifest: DrapArchiveManifest;
  private uploadLatencyTotal = 0;
  private uploadCount = 0;
  private archiveWriteTotal = 0;
  private archiveWriteCount = 0;

  constructor(options: DrapArchiveManagerOptions) {
    this.uploadService = options.uploadService;
    this.batchId = options.batchId;
    this.batchSize = Math.max(1, options.batchSize);
    this.fallbackBatchSize = Math.max(1, options.fallbackBatchSize);
    this.uploadConcurrency = Math.max(1, options.uploadConcurrency);
    this.spoolDir = options.spoolDir || join(process.cwd(), "temp", "drap-archive-spool");
    this.sourceUrl = options.sourceUrl;
    this.manifest =
      options.existingManifest
        ? {
            ...options.existingManifest,
            batchSize: this.batchSize,
            fallbackBatchSize: this.fallbackBatchSize,
            spoolDir: this.spoolDir,
          }
        : {
        strategy: "batched_gzip",
        batchSize: this.batchSize,
        fallbackBatchSize: this.fallbackBatchSize,
        spoolDir: this.spoolDir,
        nextSequence: 1,
        totalRecords: 0,
        totalSegments: 0,
        uploadedSegments: 0,
        failedSegments: 0,
        pendingSegments: 0,
        totalRawBytes: 0,
        totalCompressedBytes: 0,
        segments: [],
      };
    this.rebuildSegmentStats();
  }

  static async fromExisting(options: DrapArchiveManagerOptions): Promise<DrapArchiveManager> {
    const manager = new DrapArchiveManager(options);
    await manager.replayPendingUploads();
    return manager;
  }

  getManifest(): DrapArchiveManifest {
    return structuredClone(this.manifest);
  }

  getBatchSize(): number {
    return this.batchSize;
  }

  getFallbackBatchSize(): number {
    return this.fallbackBatchSize;
  }

  getUploadLatencyTotal(): number {
    return this.uploadLatencyTotal;
  }

  getUploadCount(): number {
    return this.uploadCount;
  }

  getArchiveWriteTotal(): number {
    return this.archiveWriteTotal;
  }

  getArchiveWriteCount(): number {
    return this.archiveWriteCount;
  }

  async append(entry: DrapArchiveEntry): Promise<DrapArchiveFlushResult> {
    this.buffer.push(entry);
    this.manifest.totalRecords += 1;
    this.manifest.totalRawBytes += entry.htmlSizeBytes;

    if (this.buffer.length < this.batchSize) {
      return { archiveWriteTimeMs: 0 };
    }

    return this.flush("batch-size");
  }

  async flush(reason = "final"): Promise<DrapArchiveFlushResult> {
    if (this.buffer.length === 0) {
      return { archiveWriteTimeMs: 0 };
    }

    const segmentEntries = this.buffer.splice(0, this.buffer.length);
    const sequence = this.manifest.nextSequence;
    this.manifest.nextSequence += 1;
    const firstRegistrationNumber = segmentEntries[0]?.registrationNumber || "000000";
    const lastRegistrationNumber = segmentEntries[segmentEntries.length - 1]?.registrationNumber || firstRegistrationNumber;
    const segmentId = `segment-${String(sequence).padStart(6, "0")}`;
    const fileName = `${segmentId}-${firstRegistrationNumber}-${lastRegistrationNumber}.jsonl.gz`;
    const objectKey = this.buildObjectKey(fileName);
    const localPath = join(this.spoolDir, this.batchId, fileName);
    const now = new Date().toISOString();
    const rawPayload = segmentEntries.map((entry) => JSON.stringify(this.toArchiveLine(entry))).join("\n") + "\n";
    const contentHash = sha256Hex(rawPayload);

    const archiveWriteStarted = performance.now();
    await mkdir(dirname(localPath), { recursive: true });
    const compressed = await gzip(Buffer.from(rawPayload, "utf8"));
    const compressedHash = sha256Hex(compressed);
    await writeFile(localPath, compressed);
    const archiveWriteTimeMs = performance.now() - archiveWriteStarted;

    const segment: DrapArchiveSegmentManifest = {
      segmentId,
      sequence,
      rowCount: segmentEntries.length,
      fileName,
      objectKey,
      localPath,
      contentHash,
      compressedHash,
      rawBytes: Buffer.byteLength(rawPayload, "utf8"),
      compressedBytes: compressed.length,
      firstRegistrationNumber,
      lastRegistrationNumber,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    this.manifest.segments.push(segment);
    this.rebuildSegmentStats();
    this.archiveWriteTotal += archiveWriteTimeMs;
    this.archiveWriteCount += 1;
    await this.persistManifest();
    this.scheduleUpload(segment, compressed);

    return { segment, archiveWriteTimeMs };
  }

  async finalize(): Promise<void> {
    await this.flush("final");
    await Promise.allSettled(this.uploads);
    await this.persistManifest();
  }

  async replayPendingUploads(): Promise<void> {
    this.rebuildSegmentStats();
    const pending = this.manifest.segments.filter((segment) => segment.status === "PENDING" || segment.status === "FAILED");
    for (const segment of pending) {
      try {
        await stat(segment.localPath);
      } catch {
        segment.status = "FAILED";
        segment.errorMessage = segment.errorMessage || "Missing local archive file during resume.";
        segment.failedAt = new Date().toISOString();
        segment.updatedAt = segment.failedAt;
        this.rebuildSegmentStats();
        continue;
      }
      this.scheduleUpload(segment);
    }

    this.rebuildSegmentStats();
    await this.persistManifest();
  }

  private scheduleUpload(segment: DrapArchiveSegmentManifest, payload?: Buffer): void {
    const task = this.uploadSegment(segment, payload).finally(() => {
      this.inFlight.delete(task);
    });

    this.inFlight.add(task);
    this.uploads.push(task);
  }

  private async uploadSegment(segment: DrapArchiveSegmentManifest, payload?: Buffer): Promise<void> {
    if (this.inFlight.size >= this.uploadConcurrency) {
      await Promise.race(this.inFlight);
    }

    const started = performance.now();
    segment.status = "UPLOADING";
    segment.updatedAt = new Date().toISOString();
    await this.persistManifest();

    try {
      const archivePayload = payload || (await readFile(segment.localPath));
      const result = await this.uploadService.uploadBuffer(archivePayload, {
        originalName: segment.fileName,
        mimeType: "application/gzip",
        folder: "drap/archive",
        objectKey: segment.objectKey,
      });

      const durationMs = performance.now() - started;
      this.uploadLatencyTotal += durationMs;
      this.uploadCount += 1;
      segment.status = "UPLOADED";
      segment.uploadedAt = new Date().toISOString();
      segment.updatedAt = segment.uploadedAt;
      segment.uploadUrl = result.url;
      this.rebuildSegmentStats();
      await this.persistManifest();
    } catch (error) {
      const durationMs = performance.now() - started;
      this.uploadLatencyTotal += durationMs;
      this.uploadCount += 1;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[DrapArchive] R2 upload failed for ${segment.objectKey}: ${errorMessage}`);
      segment.status = "FAILED";
      segment.failedAt = new Date().toISOString();
      segment.updatedAt = segment.failedAt;
      segment.errorMessage = errorMessage;
      this.rebuildSegmentStats();
      await this.persistManifest();
    }
  }

  private async persistManifest(): Promise<void> {
    const manifestPath = join(this.spoolDir, this.batchId, "manifest.json");
    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(this.manifest, null, 2)}\n`, "utf8");
  }

  private buildObjectKey(fileName: string): string {
    const base = `drap/archive/${this.batchId}`;
    return `${base}/${fileName}`;
  }

  private rebuildSegmentStats(): void {
    this.manifest.totalSegments = this.manifest.segments.length;
    this.manifest.uploadedSegments = this.manifest.segments.filter((segment) => segment.status === "UPLOADED").length;
    this.manifest.failedSegments = this.manifest.segments.filter((segment) => segment.status === "FAILED").length;
    this.manifest.pendingSegments = this.manifest.segments.filter(
      (segment) => segment.status === "PENDING" || segment.status === "UPLOADING",
    ).length;
    this.manifest.totalCompressedBytes = this.manifest.segments.reduce(
      (sum, segment) => sum + segment.compressedBytes,
      0,
    );
  }

  private toArchiveLine(entry: DrapArchiveEntry): Record<string, unknown> {
    return {
      batchId: this.batchId,
      sourceUrl: this.sourceUrl,
      rowNumber: entry.rowNumber,
      registrationNumber: entry.registrationNumber,
      requestUrl: entry.requestUrl,
      finalUrl: entry.finalUrl,
      httpStatus: entry.httpStatus,
      htmlHash: entry.htmlHash,
      htmlSizeBytes: entry.htmlSizeBytes,
      fetchTimeMs: entry.fetchTimeMs,
      parseTimeMs: entry.parseTimeMs,
      dbWriteTimeMs: entry.dbWriteTimeMs,
      retryCount: entry.retryCount,
      status: entry.status,
      errorMessage: entry.errorMessage,
      parsed: entry.parsed,
      rawHtml: entry.rawHtml,
    };
  }
}

function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
