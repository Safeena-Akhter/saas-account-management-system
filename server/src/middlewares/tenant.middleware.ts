import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/AppError";

// Every route that reads/writes company-owned data (users, and every
// business module built on top of it - customers, invoices, etc.) must be
// mounted behind BOTH `requireAuth` and this middleware, in that order:
//
//   router.get("/", requireAuth, requireCompanyScope, controller.list)
//
// `requireAuth` only guarantees "this is a valid, logged-in user" - it says
// nothing about whether that user belongs to a company. SUPER_ADMIN
// legitimately has `companyId = null` (platform-level, not tenant-scoped),
// so without this check a SUPER_ADMIN token would sail straight into
// `where: { companyId: req.user.companyId }` as `where: { companyId: null }`
// and either return nothing or, worse, match rows that were themselves
// created with a null companyId. Failing closed here means every downstream
// repository can trust `req.user.companyId` is a real, non-null string.
//
// SUPER_ADMIN-only platform routes (manage companies, assign plans, etc.)
// are a separate route tree gated by `requireRole("SUPER_ADMIN")` instead -
// they never pass through this middleware.
export function requireCompanyScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (!req.user.companyId) {
    return next(new AppError("This action requires a company account", 403));
  }

  next();
}
