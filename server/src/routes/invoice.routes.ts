import { Router } from "express";

import * as invoiceController from "../controllers/invoice.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { INVOICE_MODULE_DELETE_ROLES, INVOICE_MODULE_WRITE_ROLES } from "../constants/roles";
import {
  createInvoiceSchema,
  listInvoiceQuerySchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema
} from "../validators/invoice.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Everyone in the company can view invoices (per spec, Employee = View) -
// same reasoning as Customers: an Employee recording a payment needs to see
// which invoices are open, and the Payments module's invoice picker
// (useInvoices()) relies on this being unguarded for every role.
router.get("/", validateQuery(listInvoiceQuerySchema), invoiceController.list);
router.get("/:id", invoiceController.getById);

// Create/edit/delete/restore - Business Owner, Manager, Accountant (full
// CRUD per spec). Employee is excluded here (previously mistakenly allowed
// to create - fixed to match the module's RBAC spec: Employee is view-only).
router.post("/", requireRole(...INVOICE_MODULE_WRITE_ROLES), validateBody(createInvoiceSchema), invoiceController.create);

router.patch(
  "/:id",
  requireRole(...INVOICE_MODULE_WRITE_ROLES),
  validateBody(updateInvoiceSchema),
  invoiceController.update
);

router.patch(
  "/:id/status",
  requireRole(...INVOICE_MODULE_WRITE_ROLES),
  validateBody(updateInvoiceStatusSchema),
  invoiceController.updateStatus
);

router.patch("/:id/restore", requireRole(...INVOICE_MODULE_DELETE_ROLES), invoiceController.restore);

router.delete("/:id", requireRole(...INVOICE_MODULE_DELETE_ROLES), invoiceController.remove);

export default router;
