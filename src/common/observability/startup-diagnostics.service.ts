import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StartupDiagnosticsService {
  private readonly logger = new Logger(StartupDiagnosticsService.name);

  constructor(private readonly config: ConfigService) {}

  log(): void {
    this.logger.log(
      JSON.stringify({
        event: "startup_diagnostics",
        app: this.config.get<string>("app.name"),
        environment: this.config.get<string>("app.nodeEnv"),
        port: this.config.get<number>("app.port"),
        databaseConfigured: Boolean(this.config.get<string>("database.url")),
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

