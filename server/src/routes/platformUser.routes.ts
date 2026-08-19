import { Router } from "express";

import * as platformUserController from "../controllers/platformUser.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateQuery } from "../middlewares/validate.middleware";
import { listPlatformUsersQuerySchema } from "../validators/platformUser.validator";

const router = Router();

// Platform-level user *management* - view/activate/deactivate a user in
// ANY company. SUPER_ADMIN only, and deliberately not behind
// requireCompanyScope (SUPER_ADMIN's companyId is always null and that's
// correct here, not an error condition) - same pattern as
// platformCompany.routes.ts. Distinct from user.routes.ts, which is a
// single company's own User Management module (Business Owner/Manager,
// tenant-scoped).
router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", validateQuery(listPlatformUsersQuerySchema), platformUserController.list);
router.get("/:id", platformUserController.details);
router.patch("/:id/activate", platformUserController.activate);
router.patch("/:id/deactivate", platformUserController.deactivate);

export default router;
