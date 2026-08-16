// Access + refresh token helpers built on top of `jsonwebtoken`.
//
// Access tokens are short-lived and carry the claims the rest of the API
// needs on every request (userId, role, companyId) so route handlers never
// have to hit the database just to know "who is this and what can they do".
// Refresh tokens are opaque as far as their payload goes (userId only) and
// are additionally persisted in the `RefreshToken` table so they can be
// revoked (logout, rotation) instead of just relying on expiry.

import jwt from "jsonwebtoken";

import { env } from "../config/env";
import type { Role } from "@prisma/client";

export type AccessTokenPayload = {
  sub: string; // userId
  role: Role;
  companyId: string | null;
};

export type RefreshTokenPayload = {
  sub: string; // userId
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
