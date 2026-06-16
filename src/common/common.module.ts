import { Global, Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../modules/auth/auth.module";
import { AdminGuard } from "./guards/admin.guard";
import { AuthGuard } from "./guards/auth.guard";
import { InternalGuard } from "./guards/internal.guard";
import { ErrorLoggerService } from "./logging/error-logger.service";
import { StructuredLoggerService } from "./logging/structured-logger.service";
import { RequestTracingService } from "./observability/request-tracing.service";
import { StartupDiagnosticsService } from "./observability/startup-diagnostics.service";

@Global()
@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    AdminGuard,
    AuthGuard,
    InternalGuard,
    ErrorLoggerService,
    StructuredLoggerService,
    RequestTracingService,
    StartupDiagnosticsService,
  ],
  exports: [
    AdminGuard,
    AuthGuard,
    InternalGuard,
    ErrorLoggerService,
    StructuredLoggerService,
    RequestTracingService,
    StartupDiagnosticsService,
  ],
})
export class CommonModule {}
