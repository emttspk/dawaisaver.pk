import { Module } from "@nestjs/common";
import { ErrorLoggerService } from "./logging/error-logger.service";
import { StructuredLoggerService } from "./logging/structured-logger.service";
import { RequestTracingService } from "./observability/request-tracing.service";
import { StartupDiagnosticsService } from "./observability/startup-diagnostics.service";

@Module({
  providers: [
    ErrorLoggerService,
    StructuredLoggerService,
    RequestTracingService,
    StartupDiagnosticsService,
  ],
  exports: [
    ErrorLoggerService,
    StructuredLoggerService,
    RequestTracingService,
    StartupDiagnosticsService,
  ],
})
export class CommonModule {}

