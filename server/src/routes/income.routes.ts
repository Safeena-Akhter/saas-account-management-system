import { Router } from "express";

import * as incomeController from "../controllers/income.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { INCOME_MODULE_VIEW_ROLES, INCOME_MODULE_WRITE_ROLES } from "../constants/roles";
import { createIncomeSchema, listIncomesQuerySchema, updateIncomeSchema } from "../validators/income.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Same RBAC shape as Expense (its "money out" peer): Manager can view,
// only Owner/Accountant record or edit.
router.get("/", requireRole(...INCOME_MODULE_VIEW_ROLES), validateQuery(listIncomesQuerySchema), incomeController.list);
router.get("/:id", requireRole(...INCOME_MODULE_VIEW_ROLES), incomeController.getById);

router.post("/", requireRole(...INCOME_MODULE_WRITE_ROLES), validateBody(createIncomeSchema), incomeController.create);
router.patch("/:id", requireRole(...INCOME_MODULE_WRITE_ROLES), validateBody(updateIncomeSchema), incomeController.update);

router.delete("/:id", requireRole(...INCOME_MODULE_WRITE_ROLES), incomeController.remove);

export default router;
