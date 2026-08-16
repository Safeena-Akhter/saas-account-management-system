import { Router } from "express";

import * as controller from "../controllers/incomeCategory.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { INCOME_MODULE_VIEW_ROLES, INCOME_MODULE_WRITE_ROLES } from "../constants/roles";
import {
  createIncomeCategorySchema,
  listIncomeCategoriesQuerySchema,
  updateIncomeCategorySchema
} from "../validators/incomeCategory.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Same RBAC shape as category.routes.ts: Manager can view (they see the
// picker when reading incomes) but only Owner/Accountant manage the list
// itself - matches INCOME_MODULE_WRITE_ROLES for the Income records
// these categorize.
router.get("/", requireRole(...INCOME_MODULE_VIEW_ROLES), validateQuery(listIncomeCategoriesQuerySchema), controller.list);
router.get("/:id", requireRole(...INCOME_MODULE_VIEW_ROLES), controller.getById);

router.post("/", requireRole(...INCOME_MODULE_WRITE_ROLES), validateBody(createIncomeCategorySchema), controller.create);
router.patch("/:id", requireRole(...INCOME_MODULE_WRITE_ROLES), validateBody(updateIncomeCategorySchema), controller.update);
router.patch("/:id/activate", requireRole(...INCOME_MODULE_WRITE_ROLES), controller.activate);
router.patch("/:id/deactivate", requireRole(...INCOME_MODULE_WRITE_ROLES), controller.deactivate);

router.delete("/:id", requireRole(...INCOME_MODULE_WRITE_ROLES), controller.remove);

export default router;
