import { Router } from "express";

import * as planController from "../controllers/plan.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { createPlanSchema, updatePlanSchema } from "../validators/plan.validator";

const router = Router();

// Every authenticated role can see which plans are currently for sale -
// this is what powers the pricing/upgrade screen for a Business Owner (and
// is harmless for Manager/Accountant/Employee to read too, same as
// Company's own read-only visibility elsewhere). Declared before the
// SUPER_ADMIN-only block below so it isn't caught by that router.use().
router.get("/active", requireAuth, planController.listActive);

// Everything else - full plan list (including inactive), create, edit,
// activate/deactivate, delete - is platform-level plan *management*, not
// tenant data, so this deliberately does NOT go through
// requireCompanyScope (a SUPER_ADMIN has companyId = null, and that is
// correct here, not an error condition).
router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", planController.list);
router.post("/", validateBody(createPlanSchema), planController.create);
router.patch("/:id", validateBody(updatePlanSchema), planController.update);
router.patch("/:id/activate", planController.activate);
router.patch("/:id/deactivate", planController.deactivate);
router.delete("/:id", planController.remove);

export default router;
