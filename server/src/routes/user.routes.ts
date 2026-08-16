import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { USER_MANAGEMENT_VIEW_ROLES } from "../constants/roles";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "../validators/user.validator";

const router = Router();

// Same reasoning as auth.routes.ts's resend-verification limit: resending
// triggers outbound email, so it gets its own tighter ceiling separate from
// ordinary CRUD - 5 per 15 minutes per IP, not the general API rate.
const resendInvitationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

// requireAuth -> requireCompanyScope -> requireRole, in that order: you must
// be logged in, then you must belong to a company (rules out SUPER_ADMIN),
// then your role must be one that's allowed into User Management at all.
// Per the RBAC spec: Business Owner (full access) and Manager (view only)
// pass this gate; Accountant and Employee get a 403 here, before any
// handler runs - they never even reach the tenant-scoped queries.
router.use(requireAuth, requireCompanyScope, requireRole(...USER_MANAGEMENT_VIEW_ROLES));

// View - Business Owner and Manager both allowed (RBAC gate above already
// enforces this; no extra requireRole needed on these two routes).
router.get("/", validateQuery(listUsersQuerySchema), userController.list);

// Everything below mutates a user, so it's Business Owner only - Managers
// pass the router-level gate (they can view) but are turned away here.
router.post("/", requireRole("BUSINESS_OWNER"), validateBody(createUserSchema), userController.create);
router.patch("/:id", requireRole("BUSINESS_OWNER"), validateBody(updateUserSchema), userController.update);
router.patch("/:id/activate", requireRole("BUSINESS_OWNER"), userController.activate);
router.patch("/:id/deactivate", requireRole("BUSINESS_OWNER"), userController.deactivate);
router.post(
  "/:id/resend-invitation",
  requireRole("BUSINESS_OWNER"),
  resendInvitationRateLimit,
  userController.resendInvitation
);
router.delete("/:id", requireRole("BUSINESS_OWNER"), userController.remove);

export default router;
