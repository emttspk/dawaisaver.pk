export type DrapMirrorRuntimeState = "RUNNING" | "PAUSED";

export function isMirrorEnabled(): boolean {
  return parseBoolean(process.env.MIRROR_ENABLED, false);
}

export function isMirrorMigrationMode(): boolean {
  return parseBoolean(process.env.MIRROR_MIGRATION_MODE, true);
}

export function getMirrorRuntimeState(): DrapMirrorRuntimeState {
  return isMirrorEnabled() && !isMirrorMigrationMode() ? "RUNNING" : "PAUSED";
}

export function assertMirrorExecutionAllowed(): void {
  if (getMirrorRuntimeState() === "PAUSED") {
    throw new Error(
      "DRAP mirror execution is paused. Set MIRROR_ENABLED=true and MIRROR_MIGRATION_MODE=false to re-enable it on Hetzner/Coolify.",
    );
  }
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
