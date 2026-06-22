import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { setPrismaService } from "./drap.freeze";

export type MirrorControlAction = "start" | "pause" | "resume" | "stop";

export interface MirrorControlResult {
  success: boolean;
  message: string;
}

@Injectable()
export class DrapMirrorControlService implements OnModuleInit {
  private readonly logger = new Logger(DrapMirrorControlService.name);
  private static readonly CONTROL_KEY = "drap_mirror:control";

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    setPrismaService(this.prisma);
  }

  async start(): Promise<MirrorControlResult> {
    await this.setControlState("running");
    this.logger.log("DRAP mirror started via admin control");
    return { success: true, message: "DRAP mirror started successfully." };
  }

  async pause(): Promise<MirrorControlResult> {
    await this.setControlState("paused");
    this.logger.log("DRAP mirror paused via admin control");
    return { success: true, message: "DRAP mirror paused successfully." };
  }

  async resume(): Promise<MirrorControlResult> {
    await this.setControlState("running");
    this.logger.log("DRAP mirror resumed via admin control");
    return { success: true, message: "DRAP mirror resumed successfully." };
  }

  async recover(): Promise<MirrorControlResult> {
    const runningBatches = await this.prisma.importBatch.findMany({
      where: {
        adapterType: "drap-mirror",
        status: "RUNNING",
      },
    });

    if (runningBatches.length === 0) {
      return { success: false, message: "No saved checkpoints found for recovery." };
    }

    await this.setControlState("running");
    this.logger.log(`DRAP mirror recovery initiated: found ${runningBatches.length} RUNNING batches`);
    return { success: true, message: `DRAP mirror recovery initiated. Found ${runningBatches.length} RUNNING batches.` };
  }

  async stop(): Promise<MirrorControlResult> {
    await this.setControlState("stopped");
    this.logger.log("DRAP mirror stopped via admin control");
    return { success: true, message: "DRAP mirror stopped successfully." };
  }

  async getMirrorState(): Promise<"running" | "paused" | "stopped" | "interrupted"> {
    const state = await this.getControlState();
    if (state === "running" || state === "paused" || state === "stopped") {
      return state;
    }
    return "stopped";
  }

  private async getControlState(): Promise<string | null> {
    try {
      const controlRecord = await this.prisma.mirrorRuntimeControl.findUnique({
        where: { key: DrapMirrorControlService.CONTROL_KEY },
      });
      return controlRecord?.state ?? null;
    } catch {
      return null;
    }
  }

  private async setControlState(state: "running" | "paused" | "stopped"): Promise<void> {
    await this.prisma.mirrorRuntimeControl.upsert({
      where: { key: DrapMirrorControlService.CONTROL_KEY },
      update: { 
        state, 
        updatedAt: new Date(),
      },
      create: { 
        key: DrapMirrorControlService.CONTROL_KEY, 
        state,
        updatedAt: new Date(),
      },
    });
  }
}