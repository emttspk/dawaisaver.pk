import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>("database.url");
    super({ datasourceUrl: databaseUrl });
  }

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.configService.get<string>("database.url");

    if (!databaseUrl) {
      this.logger.warn("DATABASE_URL is not configured. Database features are disabled.");
      return;
    }

    await this.$connect();
    this.logger.log("Prisma connected to PostgreSQL.");
  }

  async onModuleDestroy(): Promise<void> {
    const databaseUrl = this.configService.get<string>("database.url");
    if (!databaseUrl) {
      return;
    }

    await this.$disconnect();
    this.logger.log("Prisma disconnected.");
  }

  async isHealthy(): Promise<boolean> {
    const databaseUrl = this.configService.get<string>("database.url");
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
