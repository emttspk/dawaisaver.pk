import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { AuthGuard } from "./auth.guard";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authGuard: AuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.authGuard.canActivate(context);
    const request = context.switchToHttp().getRequest<Request>();
    if (request.user?.role === "ADMIN" || request.user?.role === "REVIEWER") {
      return true;
    }
    throw new UnauthorizedException("Admin or reviewer role required.");
  }
}
