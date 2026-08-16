import { Router } from "express";

import * as platformCompanyController from "../controllers/platformCompany.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { updateCompanyProfileSchema } from "../validators/company.validator";
import { listPlatformCompaniesQuerySchema, listPlatformCompanyUsersQuerySchema } from "../validators/platformCompany.validator";

const router = Router();

// Platform-level company *management* (as opposed to company.routes.ts's
// /me, which is a company user managing their own company) - SUPER_ADMIN
// only, and deliberately not behind requireCompanyScope, since
// SUPER_ADMIN's companyId is always null and that's correct here, not an
// error condition. See platformCompany.repository.ts for why every
// endpoint here transparently excludes (or, for the single-company detail
// view, explicitly still shows) soft-deleted companies.
router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", validateQuery(listPlatformCompaniesQuerySchema), platformCompanyController.list);
router.get("/:id", platformCompanyController.details);
router.get("/:id/users", validateQuery(listPlatformCompanyUsersQuerySchema), platformCompanyController.listUsers);
// Reuses company.validator.ts's updateCompanyProfileSchema wholesale - a
// Super Admin editing a company's profile fields (name, address, phone,
// contactEmail, taxNumber, currency) is validated exactly the same way the
// company's own Owner editing those same fields already is, via
// company.routes.ts's PATCH /me.
router.patch("/:id", validateBody(updateCompanyProfileSchema), platformCompanyController.update);
router.patch("/:id/suspend", platformCompanyController.suspend);
router.patch("/:id/activate", platformCompanyController.activate);
router.delete("/:id", platformCompanyController.remove);

export default router;
