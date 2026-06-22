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

@Injectable()
export class DrapMirrorWorkerLauncherService {
  private readonly logger = new Logger(DrapMirrorWorkerLauncherService.name);

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
    }

    const runId = this.generateRunId();
    
    const env = {
      ...process.env,
      DRAP_MIRROR_RUN_ID: runId,
      NODE_ENV: process.env.NODE_ENV || "production",
    };

    const cliPath = join(__dirname, "..", "..", "..", "node_modules", ".bin", "ts-node");
    const scriptPath = join(__dirname, "..", "..", "..", "src", "cli", "drap-mirror.ts");
    const args = ["-r", "dotenv/config", scriptPath];

    this.logger.log(`Launching DRAP mirror worker: ${cliPath} ${args.join(" ")}`);

    const worker = spawn(cliPath, args, {
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

    this.logger.log(`Worker spawned with PID ${worker.pid}`);

    return {
      success: true,
      message: `DRAP mirror worker launched with PID ${worker.pid}.`,
      alreadyRunning: false,
    };
  }

  private async findActiveBatch(): Promise<{ id: string; updatedAt: Date } | null> {
    const batch = await this.prisma.importBatch.findFirst({
      where: {
        adapterType: "drap-mirror",
        status: "RUNNING",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, updatedAt: true },
    });
    return batch;
  }

  private async isBatchStale(batch: { updatedAt: Date }): Promise<boolean> {
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000);
    return batch.updatedAt < staleThreshold;
  }

  private generateRunId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `run_${timestamp}_${random}`;
  }
}