import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class HealthService {
  private readonly startedAt = new Date();

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
    };
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

