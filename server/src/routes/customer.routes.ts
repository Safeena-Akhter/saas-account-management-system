import { Router } from "express";

import * as customerController from "../controllers/customer.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { CUSTOMER_MODULE_DELETE_ROLES, CUSTOMER_MODULE_VIEW_ROLES, CUSTOMER_MODULE_WRITE_ROLES } from "../constants/roles";
import { createCustomerSchema, listCustomersQuerySchema, updateCustomerSchema } from "../validators/customer.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

// Everyone in the company can hit the plain list (e.g. an Employee raising
// an invoice needs to pick a customer) - see CUSTOMER_MODULE_VIEW_ROLES's
// comment in constants/roles.ts for why this route intentionally isn't
// gated the same way GET /:id and the module's UI page are.
router.get("/", validateQuery(listCustomersQuerySchema), customerController.list);

// Full Customer Details view (balance, credit limit, recent invoices/
// payments, activity timeline) - Business Owner, Manager, Accountant only.
// Employee gets a 403 here even though it can hit GET / above.
router.get("/:id", requireRole(...CUSTOMER_MODULE_VIEW_ROLES), customerController.getById);

router.post(
  "/",
  requireRole(...CUSTOMER_MODULE_WRITE_ROLES),
  validateBody(createCustomerSchema),
  customerController.create
);
router.patch(
  "/:id",
  requireRole(...CUSTOMER_MODULE_WRITE_ROLES),
  validateBody(updateCustomerSchema),
  customerController.update
);
router.patch("/:id/activate", requireRole(...CUSTOMER_MODULE_WRITE_ROLES), customerController.activate);
router.patch("/:id/deactivate", requireRole(...CUSTOMER_MODULE_WRITE_ROLES), customerController.deactivate);

// Delete (hard delete, blocked if the customer has invoices/payments - see
// customer.service.ts) is Business Owner only: "Full Access" per spec is
// narrower than Manager's Create/Update/View grant.
router.delete("/:id", requireRole(...CUSTOMER_MODULE_DELETE_ROLES), customerController.remove);

export default router;
