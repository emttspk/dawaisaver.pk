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
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? exception.message : "Unexpected application error.";

    this.logger.error(message, exception instanceof Error ? exception.stack : undefined);

    response.status(status).json(
      ResponseFormatter.error({
        statusCode: status,
        message,
        path: request?.url,
        traceId: request?.headers?.["x-request-id"],
      }),
    );
  }
}

