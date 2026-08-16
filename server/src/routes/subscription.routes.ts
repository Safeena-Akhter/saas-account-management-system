import { Router } from "express";

import * as subscriptionController from "../controllers/subscription.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { SUBSCRIPTION_MODULE_VIEW_ROLES, SUBSCRIPTION_MODULE_WRITE_ROLES } from "../constants/roles";
import {
  assignSubscriptionSchema,
  changeMySubscriptionSchema,
  updateSubscriptionStatusSchema
} from "../validators/subscription.validator";

const router = Router();

// Business Owner (full) / Manager (view only) self-service, scoped to the
// caller's own company via requireCompanyScope. Declared before the
// SUPER_ADMIN-only router.use() below so it isn't caught by that gate -
// same ordering reasoning as plan.routes.ts's GET /active.
router.get(
  "/me",
  requireAuth,
  requireCompanyScope,
  requireRole(...SUBSCRIPTION_MODULE_VIEW_ROLES),
  subscriptionController.getMine
);
router.get(
  "/me/usage",
  requireAuth,
  requireCompanyScope,
  requireRole(...SUBSCRIPTION_MODULE_VIEW_ROLES),
  subscriptionController.getMyUsage
);
router.get(
  "/me/history",
  requireAuth,
  requireCompanyScope,
  requireRole(...SUBSCRIPTION_MODULE_VIEW_ROLES),
  subscriptionController.getMyHistory
);
router.post(
  "/me/change",
  requireAuth,
  requireCompanyScope,
  requireRole(...SUBSCRIPTION_MODULE_WRITE_ROLES),
  validateBody(changeMySubscriptionSchema),
  subscriptionController.changeMine
);
router.post(
  "/me/renew",
  requireAuth,
  requireCompanyScope,
  requireRole(...SUBSCRIPTION_MODULE_WRITE_ROLES),
  subscriptionController.renewMine
);
router.post(
  "/me/cancel",
  requireAuth,
  requireCompanyScope,
  requireRole(...SUBSCRIPTION_MODULE_WRITE_ROLES),
  subscriptionController.cancelMine
);

// Platform-level: every company's subscriptions, assignable/editable by a
// Super Admin only. Deliberately NOT behind requireCompanyScope - a Super
// Admin has companyId = null, which is correct here, not an error
// condition (same reasoning as plan.routes.ts's management block).
router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", subscriptionController.list);
router.post("/", validateBody(assignSubscriptionSchema), subscriptionController.assign);
router.patch("/:id/status", validateBody(updateSubscriptionStatusSchema), subscriptionController.updateStatus);

export default router;
