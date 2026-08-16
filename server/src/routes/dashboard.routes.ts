import { Router } from "express";

import * as dashboardController from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// No requireCompanyScope here - SUPER_ADMIN legitimately has no companyId
// and still needs this route (see dashboard.controller.ts, which branches
// on role before touching companyId).
router.use(requireAuth);

router.get("/", dashboardController.getMyDashboard);

export default router;
