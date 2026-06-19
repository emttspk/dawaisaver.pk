import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

function normalizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("Value: ")) {
    return url.slice(7);
  }
  return url;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService?: ConfigService) {
    const configUrl = configService?.get<string>("database.url");
    const envUrl = process.env.DATABASE_URL;
    const databaseUrl = normalizeDatabaseUrl(configUrl) ?? normalizeDatabaseUrl(envUrl);
    super({ datasourceUrl: databaseUrl });
  }

  async onModuleInit(): Promise<void> {
    const configUrl = this.configService?.get<string>("database.url");
    const envUrl = process.env.DATABASE_URL;
    const databaseUrl = normalizeDatabaseUrl(configUrl) ?? normalizeDatabaseUrl(envUrl);

    this.logger.log(`[STARTUP] DATABASE_URL exists: ${!!databaseUrl}`);
    if (databaseUrl) {
      this.logger.log(`[STARTUP] DATABASE_URL prefix: ${databaseUrl.substring(0, 30)}...`);
    }

    if (!databaseUrl) {
      this.logger.warn("DATABASE_URL is not configured. Database features are disabled.");
      return;
    }

    await this.$connect();
    this.logger.log("Prisma connected to PostgreSQL.");
  }

  async onModuleDestroy(): Promise<void> {
    const configUrl = this.configService?.get<string>("database.url");
    const envUrl = process.env.DATABASE_URL;
    const databaseUrl = normalizeDatabaseUrl(configUrl) ?? normalizeDatabaseUrl(envUrl);
    if (!databaseUrl) {
      return;
    }

    await this.$disconnect();
    this.logger.log("Prisma disconnected.");
  }

  async isHealthy(): Promise<boolean> {
    const configUrl = this.configService?.get<string>("database.url");
    const envUrl = process.env.DATABASE_URL;
    const databaseUrl = normalizeDatabaseUrl(configUrl) ?? normalizeDatabaseUrl(envUrl);
    if (!databaseUrl) {
      this.logger.warn("Database health check skipped because DATABASE_URL is not configured.");
      return false;
    }

    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error("Database health check failed.", error instanceof Error ? error.stack : undefined);
      return false;
    }
  }
}
