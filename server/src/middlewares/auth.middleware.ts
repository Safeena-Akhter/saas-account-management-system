import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";

// Reads `Authorization: Bearer <accessToken>`, verifies it, and attaches the
// decoded claims to `req.user`. Every route below this middleware can then
// trust `req.user.id` / `.role` / `.companyId` without touching the DB.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
      companyId: payload.companyId
    };

    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401));
  }
}
