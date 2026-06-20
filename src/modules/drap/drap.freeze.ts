import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";

export type DrapMirrorRuntimeState = "RUNNING" | "PAUSED";

const logger = new Logger("DrapFreeze");

let prismaService: PrismaService | null = null;

export function setPrismaService(prisma: PrismaService): void {
  prismaService = prisma;
}

export function isMirrorEnabled(): boolean {
  return parseBoolean(process.env.MIRROR_ENABLED, false);
}

export function isMirrorMigrationMode(): boolean {
  return parseBoolean(process.env.MIRROR_MIGRATION_MODE, true);
}

export async function getMirrorRuntimeState(): Promise<DrapMirrorRuntimeState> {
  if (!isMirrorEnabled() || isMirrorMigrationMode()) {
    return "PAUSED";
  }
  
  if (prismaService) {
    try {
      const controlRecord = await prismaService.mirrorRuntimeControl.findUnique({
        where: { key: "drap_mirror:control" },
      });
      if (controlRecord?.state === "paused") {
        return "PAUSED";
      }
      if (controlRecord?.state === "stopped") {
        return "PAUSED";
      }
    } catch (error) {
      logger.error("Failed to read mirror control state", error);
      return "PAUSED";
    }
  }
  
  return "RUNNING";
}

export async function assertMirrorExecutionAllowed(): Promise<void> {
  const state = await getMirrorRuntimeState();
  if (state === "PAUSED") {
    throw new Error(
      "DRAP mirror execution is paused. Use admin control panel to start the mirror.",
    );
  }
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
