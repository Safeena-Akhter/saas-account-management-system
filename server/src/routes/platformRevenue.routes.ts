import { Router } from "express";

import * as platformRevenueController from "../controllers/platformRevenue.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

// SUPER_ADMIN only, same pattern as every other /platform/* route.
router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", platformRevenueController.overview);

export default router;
