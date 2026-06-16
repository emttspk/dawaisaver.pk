import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "@prisma/client";
import { TokenPayload } from "./auth.types";

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  signAccessToken(user: { id: string; role: UserRole; email?: string | null }): string {
    return this.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
        type: "access",
      },
      this.accessSecret,
      this.durationToSeconds(this.config.get<string>("auth.jwtExpiresIn", "15m")),
    );
  }

  signRefreshToken(user: { id: string; role: UserRole; email?: string | null }): string {
    return this.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
        type: "refresh",
      },
      this.refreshSecret,
      this.durationToSeconds(this.config.get<string>("auth.jwtRefreshExpiresIn", "7d")),
    );
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.verify(token, this.accessSecret, "access");
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.verify(token, this.refreshSecret, "refresh");
  }

  hashToken(token: string): string {
    return createHmac("sha256", this.refreshSecret).update(token).digest("hex");
  }

  getRefreshExpiry(): Date {
    const seconds = this.durationToSeconds(this.config.get<string>("auth.jwtRefreshExpiresIn", "7d"));
    return new Date(Date.now() + seconds * 1000);
  }

  private sign(payload: Omit<TokenPayload, "iat" | "exp">, secret: string, expiresInSeconds: number): string {
    const now = Math.floor(Date.now() / 1000);
    const body: TokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedBody = base64UrlEncode(JSON.stringify(body));
    const signature = this.signParts(encodedHeader, encodedBody, secret);
    return `${encodedHeader}.${encodedBody}.${signature}`;
  }

  private verify(token: string, secret: string, expectedType: TokenPayload["type"]): TokenPayload {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException("Invalid token.");
    }

    const [encodedHeader, encodedBody, signature] = parts;
    const expectedSignature = this.signParts(encodedHeader, encodedBody, secret);
    if (!safeCompare(signature, expectedSignature)) {
      throw new UnauthorizedException("Invalid token signature.");
    }

    const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8")) as TokenPayload;
    if (payload.type !== expectedType || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Token expired or invalid.");
    }
    return payload;
  }

  private signParts(encodedHeader: string, encodedBody: string, secret: string): string {
    return createHmac("sha256", secret).update(`${encodedHeader}.${encodedBody}`).digest("base64url");
  }

  private durationToSeconds(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) {
      return 900;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return amount * multipliers[unit];
  }

  private get accessSecret(): string {
    return this.config.get<string>("auth.jwtSecret", "development-access-secret");
  }

  private get refreshSecret(): string {
    return this.config.get<string>("auth.jwtRefreshSecret", "development-refresh-secret");
  }
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function safeCompare(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

