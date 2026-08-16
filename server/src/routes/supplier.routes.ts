import { Router } from "express";

import * as supplierController from "../controllers/supplier.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { SUPPLIER_MODULE_DELETE_ROLES, SUPPLIER_MODULE_VIEW_ROLES, SUPPLIER_MODULE_WRITE_ROLES } from "../constants/roles";
import { createSupplierSchema, listSuppliersQuerySchema, updateSupplierSchema } from "../validators/supplier.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Unlike Customer's GET /customers, this list IS gated by
// SUPPLIER_MODULE_VIEW_ROLES - Employee can't create Expenses at all
// (expense.routes.ts limits that to Business Owner/Accountant), so there's
// no "Employee needs the plain list for a picker" carve-out to preserve.
// See SUPPLIER_MODULE_VIEW_ROLES's comment in constants/roles.ts.
router.get("/", requireRole(...SUPPLIER_MODULE_VIEW_ROLES), validateQuery(listSuppliersQuerySchema), supplierController.list);

router.get("/:id", requireRole(...SUPPLIER_MODULE_VIEW_ROLES), supplierController.getById);

router.post(
  "/",
  requireRole(...SUPPLIER_MODULE_WRITE_ROLES),
  validateBody(createSupplierSchema),
  supplierController.create
);
router.patch(
  "/:id",
  requireRole(...SUPPLIER_MODULE_WRITE_ROLES),
  validateBody(updateSupplierSchema),
  supplierController.update
);
router.patch("/:id/activate", requireRole(...SUPPLIER_MODULE_WRITE_ROLES), supplierController.activate);
router.patch("/:id/deactivate", requireRole(...SUPPLIER_MODULE_WRITE_ROLES), supplierController.deactivate);

// Delete (hard delete, blocked if the supplier has expenses - see
// supplier.service.ts) is Business Owner only: "Full Access" per spec is
// narrower than Manager's Create/Update/View grant.
router.delete("/:id", requireRole(...SUPPLIER_MODULE_DELETE_ROLES), supplierController.remove);

export default router;
