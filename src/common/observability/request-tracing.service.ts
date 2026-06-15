import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

@Injectable()
export class RequestTracingService {
  createTraceId(): string {
    return randomUUID();
  }
}

