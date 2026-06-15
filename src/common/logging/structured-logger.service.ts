import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class StructuredLoggerService {
  private readonly logger = new Logger(StructuredLoggerService.name);

  log(event: string, payload: Record<string, unknown> = {}): void {
    this.logger.log(JSON.stringify({ event, ...payload, timestamp: new Date().toISOString() }));
  }
}

