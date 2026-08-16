import { Router } from "express";

import * as categoryController from "../controllers/category.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { CATEGORY_MODULE_VIEW_ROLES, CATEGORY_MODULE_WRITE_ROLES } from "../constants/roles";
import { createCategorySchema, listCategoriesQuerySchema, updateCategorySchema } from "../validators/category.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Per the Category Management RBAC spec: Business Owner (full access),
// Manager (CRUD), Accountant (view), Employee (no access). Unlike
// Customer's GET /customers, there's no "Employee needs the plain list for
// a picker" carve-out - Employees can't create/edit Products either, so
// every route here (including the plain list) enforces
// CATEGORY_MODULE_VIEW_ROLES. See constants/roles.ts for why.
router.get("/", requireRole(...CATEGORY_MODULE_VIEW_ROLES), validateQuery(listCategoriesQuerySchema), categoryController.list);

// Category Details view (products count, created/updated dates) - same
// view roles as the list.
router.get("/:id", requireRole(...CATEGORY_MODULE_VIEW_ROLES), categoryController.getById);

router.post(
  "/",
  requireRole(...CATEGORY_MODULE_WRITE_ROLES),
  validateBody(createCategorySchema),
  categoryController.create
);
router.patch(
  "/:id",
  requireRole(...CATEGORY_MODULE_WRITE_ROLES),
  validateBody(updateCategorySchema),
  categoryController.update
);
router.patch("/:id/activate", requireRole(...CATEGORY_MODULE_WRITE_ROLES), categoryController.activate);
router.patch("/:id/deactivate", requireRole(...CATEGORY_MODULE_WRITE_ROLES), categoryController.deactivate);

router.delete("/:id", requireRole(...CATEGORY_MODULE_WRITE_ROLES), categoryController.remove);

export default router;
