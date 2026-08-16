import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";

import { AppError } from "../utils/AppError";

// Usage: router.get("/super-admin/companies", requireAuth, requireRole("SUPER_ADMIN"), handler)
// Must be mounted after `requireAuth` so `req.user` is already populated.
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    next();
  };
}
