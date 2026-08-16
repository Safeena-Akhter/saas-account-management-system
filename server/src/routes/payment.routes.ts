import { Router } from "express";

import * as paymentController from "../controllers/payment.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { PAYMENT_MODULE_RECEIVE_ROLES, PAYMENT_MODULE_SUPPLIER_PAY_ROLES } from "../constants/roles";
import {
  createPaymentSchema,
  createSupplierPaymentSchema,
  listPaymentQuerySchema,
  updatePaymentStatusSchema
} from "../validators/payment.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Unguarded for every company role - Employees need this to see payment
// history for a customer they're serving, same reasoning as Invoice's
// GET routes.
router.get("/", validateQuery(listPaymentQuerySchema), paymentController.list);
router.get("/:id", paymentController.getById);

// Receive Customer Payment - unchanged grant (front-desk staff take
// payments too).
router.post(
  "/",
  requireRole(...PAYMENT_MODULE_RECEIVE_ROLES),
  validateBody(createPaymentSchema),
  paymentController.create
);

// Supplier Payment - narrower grant, matching Expense's write roles (see
// constants/roles.ts's PAYMENT_MODULE_SUPPLIER_PAY_ROLES comment).
router.post(
  "/supplier",
  requireRole(...PAYMENT_MODULE_SUPPLIER_PAY_ROLES),
  validateBody(createSupplierPaymentSchema),
  paymentController.createSupplierPayment
);

router.patch(
  "/:id/status",
  requireRole(...PAYMENT_MODULE_RECEIVE_ROLES),
  validateBody(updatePaymentStatusSchema),
  paymentController.updateStatus
);

export default router;
