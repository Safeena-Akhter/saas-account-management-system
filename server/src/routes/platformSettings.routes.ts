import { Router } from "express";

import * as platformSettingsController from "../controllers/platformSettings.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { updatePlatformSettingsSchema } from "../validators/platformSettings.validator";

const router = Router();

// SUPER_ADMIN only, same pattern as every other /platform/* route.
router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", platformSettingsController.get);
router.patch("/", validateBody(updatePlatformSettingsSchema), platformSettingsController.update);

export default router;
