import { Router } from "express";

import * as expenseController from "../controllers/expense.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { uploadReceipt } from "../middlewares/upload.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { EXPENSE_MODULE_VIEW_ROLES, EXPENSE_MODULE_WRITE_ROLES } from "../constants/roles";
import { createExpenseSchema, listExpensesQuerySchema, updateExpenseSchema } from "../validators/expense.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Employees can view expenses but not the numbers behind them beyond what
// their own dashboard shows - full list/detail access is
// Accountant/Manager/Owner (EXPENSE_MODULE_VIEW_ROLES).
router.get("/", requireRole(...EXPENSE_MODULE_VIEW_ROLES), validateQuery(listExpensesQuerySchema), expenseController.list);
router.get("/:id", requireRole(...EXPENSE_MODULE_VIEW_ROLES), expenseController.getById);

router.post(
  "/",
  requireRole(...EXPENSE_MODULE_WRITE_ROLES),
  validateBody(createExpenseSchema),
  expenseController.create
);

router.patch(
  "/:id",
  requireRole(...EXPENSE_MODULE_WRITE_ROLES),
  validateBody(updateExpenseSchema),
  expenseController.update
);

// Multipart upload -> Cloudinary -> persists the resulting secure_url as
// receiptUrl. Same write-role restriction as the rest of the expense.
router.post(
  "/:id/receipt",
  requireRole(...EXPENSE_MODULE_WRITE_ROLES),
  uploadReceipt,
  expenseController.uploadReceipt
);

router.delete("/:id", requireRole(...EXPENSE_MODULE_WRITE_ROLES), expenseController.remove);

export default router;
