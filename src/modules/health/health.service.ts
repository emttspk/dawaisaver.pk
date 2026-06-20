import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class HealthService {
  private readonly startedAt = new Date();
  private readonly deployment = resolveDeploymentFingerprint();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async fullHealth() {
    const [application, database] = await Promise.all([
      this.applicationHealth(),
      this.databaseHealth(),
    ]);

    return {
      status: database.status === "ok" ? "ok" : "degraded",
      application,
      database,
    };
  }

  applicationHealth() {
    return {
      status: "ok",
      name: this.config.get<string>("app.name"),
      environment: this.config.get<string>("app.nodeEnv"),
      uptimeSeconds: Math.round(process.uptime()),
      startedAt: this.startedAt.toISOString(),
      deployment: this.deployment,
    };
  }

  deploymentHealth() {
    return this.deployment;
  }

  async databaseHealth() {
    const healthy = await this.prisma.isHealthy();
    return {
      status: healthy ? "ok" : "error",
      provider: "postgresql",
      checkedAt: new Date().toISOString(),
    };
  }
}

function resolveDeploymentFingerprint() {
  const candidates = [
    "GIT_COMMIT_SHA",
    "COMMIT_SHA",
    "SOURCE_COMMIT",
    "CF_PAGES_COMMIT_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "BUILD_SHA",
    "APP_BUILD_SHA",
    "DEPLOYMENT_SHA",
  ];

  for (const key of candidates) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return {
        commitSha: value.trim(),
        source: key,
      };
    }
  }

  return {
    commitSha: "unknown",
    source: "unavailable",
  };
}
