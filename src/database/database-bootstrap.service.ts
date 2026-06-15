import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DatabaseBootstrapService {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(private readonly config: ConfigService) {}

  async bootstrap(): Promise<void> {
    if (!this.config.get<boolean>("database.runMigrationsOnBoot")) {
      this.logger.log("Database migration runner disabled by configuration.");
      return;
    }

    this.logger.warn(
      "RUN_MIGRATIONS_ON_BOOT=true is set. Use `npm run prisma:migrate` in deployment pipelines until a migration runner is wired.",
    );
  }
}

