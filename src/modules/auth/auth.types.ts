import { UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role: UserRole;
}

export interface TokenPayload {
  sub: string;
  role: UserRole;
  email?: string | null;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}

