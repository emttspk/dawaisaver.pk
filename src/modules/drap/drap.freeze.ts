import { Injectable, Logger } from "@nestjs/common";
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
    } catch {
      return "PAUSED";
    }
  }
  
  return "RUNNING";
}

export function assertMirrorExecutionAllowed(): void {
  getMirrorRuntimeState().then((state) => {
    if (state === "PAUSED") {
      throw new Error(
        "DRAP mirror execution is paused. Set MIRROR_ENABLED=true and MIRROR_MIGRATION_MODE=false to re-enable it on Hetzner/Coolify, or use admin control panel.",
      );
    }
  });
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
