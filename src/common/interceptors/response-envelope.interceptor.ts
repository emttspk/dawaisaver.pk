import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import { ResponseFormatter } from "../responses/response-formatter";

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (value && typeof value === "object" && "success" in value) {
          return value;
        }

        return ResponseFormatter.success(value);
      }),
    );
  }
}
