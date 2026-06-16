import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { AuthGuard } from "./auth.guard";

@Injectable()
export class InternalGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly authGuard: AuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const internalKey = this.config.get<string>("auth.internalApiKey");
    const providedKey = request.header("x-internal-api-key");
    if (internalKey && providedKey === internalKey) {
      return true;
    }

    await this.authGuard.canActivate(context);
    if (request.user?.role === "ADMIN" || request.user?.role === "REVIEWER") {
      return true;
    }
    throw new UnauthorizedException("Internal API key or elevated user role required.");
  }
}
