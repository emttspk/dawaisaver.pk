import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { spawn } from "child_process";
import { join } from "path";
import { PrismaService } from "../../database/prisma.service";

export interface WorkerLaunchResult {
  success: boolean;
  message: string;
  alreadyRunning: boolean;
}

interface ActiveBatchSnapshot {
  id: string;
  updatedAt: Date;
  metadata: unknown;
}

@Injectable()
export class DrapMirrorWorkerLauncherService {
  private readonly logger = new Logger(DrapMirrorWorkerLauncherService.name);
  private static readonly ACTIVE_BATCH_STALE_MS = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async launchWorker(_action: "start" | "resume" | "recover"): Promise<WorkerLaunchResult> {
    const existingBatch = await this.findActiveBatch();
    
    if (existingBatch) {
      const isStale = await this.isBatchStale(existingBatch);
      if (!isStale) {
        this.logger.log(`Worker already running for batch ${existingBatch.id}`);
        return { success: true, message: "Worker already running.", alreadyRunning: true };
      }
      this.logger.warn(
        `Active batch ${existingBatch.id} is stale; launching a replacement worker`,
      );
    }

    const runId = this.generateRunId();
    
    const env = {
      ...process.env,
      DRAP_MIRROR_RUN_ID: runId,
      NODE_ENV: process.env.NODE_ENV || "production",
    };

    const scriptPath = join(__dirname, "..", "..", "..", "dist", "cli", "drap-mirror.js");
    
    this.logger.log(`Launching DRAP mirror worker: node ${scriptPath}`);

    const worker = spawn("node", [scriptPath], {
      cwd: process.cwd(),
      env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });

    worker.unref();

    worker.on("error", (error) => {
      this.logger.error(`Worker spawn error: ${error.message}`);
    });

    worker.on("exit", (code) => {
      this.logger.log(`Worker exited with code ${code}`);
    });

    worker.on("message", (msg) => {
      this.logger.log(`Worker message: ${msg}`);
    });

    this.logger.log(`Worker spawned with PID ${worker.pid}`);

    return {
      success: true,
      message: `DRAP mirror worker launched with PID ${worker.pid}.`,
      alreadyRunning: false,
    };
  }

  private async findActiveBatch(): Promise<ActiveBatchSnapshot | null> {
    const batch = await this.prisma.importBatch.findFirst({
      where: {
        adapterType: "drap-mirror",
        status: "RUNNING",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, updatedAt: true, metadata: true },
    });
    return batch;
  }

  private async isBatchStale(batch: ActiveBatchSnapshot): Promise<boolean> {
    const activityAt = this.extractLastActivityAt(batch.metadata) ?? batch.updatedAt;
    const staleThreshold = Date.now() - DrapMirrorWorkerLauncherService.ACTIVE_BATCH_STALE_MS;
    return activityAt.getTime() < staleThreshold;
  }

  private generateRunId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `run_${timestamp}_${random}`;
  }

  private extractLastActivityAt(metadata: unknown): Date | undefined {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return undefined;
    }

    const acquisition = (metadata as Record<string, unknown>).acquisition;
    if (!acquisition || typeof acquisition !== "object" || Array.isArray(acquisition)) {
      return undefined;
    }

    const value = (acquisition as Record<string, unknown>).lastActivityAt;
    if (typeof value !== "string" || !value.trim()) {
      return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
