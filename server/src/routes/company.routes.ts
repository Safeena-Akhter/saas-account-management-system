import { Router } from "express";

import * as companyController from "../controllers/company.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { uploadLogo } from "../middlewares/upload.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { updateCompanyProfileSchema } from "../validators/company.validator";

const router = Router();

// Super Admin's minimal company picker (id/name/isActive only) for the
// Subscription module's Assign Plan / Company Subscriptions screens -
// declared before the requireCompanyScope block below so a SUPER_ADMIN
// (companyId = null) can reach it; every other route in this file is
// tenant-scoped and would otherwise 403 a Super Admin by design (see
// requireCompanyScope's own comment).
router.get("/directory", requireAuth, requireRole("SUPER_ADMIN"), companyController.listDirectory);

// Every route below is mounted after requireAuth + requireCompanyScope, so
// SUPER_ADMIN (companyId = null) never reaches these handlers - see
// tenant.middleware.ts for why that matters.
router.use(requireAuth, requireCompanyScope);

// Any authenticated company role can view their own company's profile -
// an Employee still needs to see the company name/logo/currency to do their
// job, they just can't change it.
router.get("/me", companyController.getMyCompany);

// Only the Business Owner can edit company profile fields (address, tax
// number, currency, logo, contact info) - least privilege: Managers,
// Accountants, and Employees operate within the company, they don't
// reconfigure it.
router.patch(
  "/me",
  requireRole("BUSINESS_OWNER"),
  validateBody(updateCompanyProfileSchema),
  companyController.updateMyCompany
);

// Multipart upload -> Cloudinary -> persists the resulting secure_url as
// logoUrl. Same BUSINESS_OWNER-only restriction as the rest of the profile.
router.post("/me/logo", requireRole("BUSINESS_OWNER"), uploadLogo, companyController.uploadCompanyLogo);

export default router;
