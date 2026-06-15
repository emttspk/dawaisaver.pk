import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ResponseFormatter } from "../responses/response-formatter";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.resolveMessage(exception);

    this.logger.error(message, exception instanceof Error ? exception.stack : undefined);

    response.status(status).json(
      ResponseFormatter.error({
        code: status,
        error: message,
      }),
    );
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === "string") {
        return response;
      }
      if (typeof response === "object" && response) {
        const candidate = response as Record<string, unknown>;
        const message = candidate.message;
        if (Array.isArray(message)) {
          return message.join(", ");
        }
        if (typeof message === "string") {
          return message;
        }
      }
      return exception.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return "Unexpected application error.";
  }
}
