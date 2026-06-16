import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async register(input: { email: string; password: string; name?: string; role?: UserRole }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException("User already exists.");
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        role: input.role || "USER",
        passwordHash: hashPassword(input.password),
        sourceType: "SYSTEM",
      },
    });

    return this.issueTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash) || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid credentials.");
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = this.tokens.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    const tokenHash = this.tokens.hashToken(refreshToken);
    if (
      !user?.refreshTokenHash ||
      user.refreshTokenHash !== tokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt <= new Date() ||
      user.status !== "ACTIVE"
    ) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
    return { loggedOut: true };
  }

  private async issueTokens(user: { id: string; email: string | null; phone: string | null; name: string | null; role: UserRole }) {
    const accessToken = this.tokens.signAccessToken(user);
    const refreshToken = this.tokens.signRefreshToken(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: this.tokens.hashToken(refreshToken),
        refreshTokenExpiresAt: this.tokens.getRefreshExpiry(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }
  const hash = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");
  return hash.length === stored.length && timingSafeEqual(hash, stored);
}

