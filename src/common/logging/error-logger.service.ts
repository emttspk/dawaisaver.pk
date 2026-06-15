import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ErrorLoggerService {
  private readonly logger = new Logger(ErrorLoggerService.name);

  logError(error: unknown, context: Record<string, unknown> = {}): void {
    this.logger.error(
      JSON.stringify({
        ...context,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      error instanceof Error ? error.stack : undefined,
    );
  }
}

