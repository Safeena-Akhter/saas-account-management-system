import { Router } from "express";

import * as controller from "../controllers/expenseCategory.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { EXPENSE_MODULE_VIEW_ROLES, EXPENSE_MODULE_WRITE_ROLES } from "../constants/roles";
import {
  createExpenseCategorySchema,
  listExpenseCategoriesQuerySchema,
  updateExpenseCategorySchema
} from "../validators/expenseCategory.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Same RBAC shape as category.routes.ts: Manager can view (they see the
// picker when reading expenses) but only Owner/Accountant manage the list
// itself - matches EXPENSE_MODULE_WRITE_ROLES for the Expense records
// these categorize.
router.get("/", requireRole(...EXPENSE_MODULE_VIEW_ROLES), validateQuery(listExpenseCategoriesQuerySchema), controller.list);
router.get("/:id", requireRole(...EXPENSE_MODULE_VIEW_ROLES), controller.getById);

router.post("/", requireRole(...EXPENSE_MODULE_WRITE_ROLES), validateBody(createExpenseCategorySchema), controller.create);
router.patch("/:id", requireRole(...EXPENSE_MODULE_WRITE_ROLES), validateBody(updateExpenseCategorySchema), controller.update);
router.patch("/:id/activate", requireRole(...EXPENSE_MODULE_WRITE_ROLES), controller.activate);
router.patch("/:id/deactivate", requireRole(...EXPENSE_MODULE_WRITE_ROLES), controller.deactivate);

router.delete("/:id", requireRole(...EXPENSE_MODULE_WRITE_ROLES), controller.remove);

export default router;
