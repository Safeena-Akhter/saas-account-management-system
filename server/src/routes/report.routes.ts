import { Router } from "express";

import * as reportController from "../controllers/report.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateQuery } from "../middlewares/validate.middleware";
import { REPORT_MODULE_VIEW_ROLES } from "../constants/roles";
import {
  customerReportQuerySchema,
  expenseReportQuerySchema,
  incomeReportQuerySchema,
  invoiceReportQuerySchema,
  monthlySummaryReportQuerySchema,
  outstandingBalanceReportQuerySchema,
  paymentReportQuerySchema,
  productReportQuerySchema,
  profitLossReportQuerySchema,
  salesReportQuerySchema,
  supplierReportQuerySchema,
  taxReportQuerySchema
} from "../validators/report.validator";

const router = Router();

// Every report route is read-only and company-scoped - requireCompanyScope
// guarantees req.user.companyId is a real tenant id (never null/SUPER_ADMIN)
// before any handler runs, same as every other business module. RBAC is
// applied once at the router level (every report shares the same view
// roles - see roles.ts's REPORT_MODULE_VIEW_ROLES comment) rather than
// repeated per-route.
router.use(requireAuth, requireCompanyScope, requireRole(...REPORT_MODULE_VIEW_ROLES));

router.get("/sales", validateQuery(salesReportQuerySchema), reportController.sales);
router.get("/profit-loss", validateQuery(profitLossReportQuerySchema), reportController.profitAndLoss);
router.get(
  "/outstanding-balance",
  validateQuery(outstandingBalanceReportQuerySchema),
  reportController.outstandingBalance
);
router.get("/customers", validateQuery(customerReportQuerySchema), reportController.customers);

// -----------------------------------------------------------------------------
// Newly added reports - same requireAuth/requireCompanyScope/requireRole gate
// above (mounted once at router level) applies to every route below too.
// -----------------------------------------------------------------------------

router.get("/suppliers", validateQuery(supplierReportQuerySchema), reportController.suppliers);
router.get("/products", validateQuery(productReportQuerySchema), reportController.products);
router.get("/invoices", validateQuery(invoiceReportQuerySchema), reportController.invoices);
router.get("/expenses", validateQuery(expenseReportQuerySchema), reportController.expenses);
router.get("/incomes", validateQuery(incomeReportQuerySchema), reportController.incomes);
router.get("/payments", validateQuery(paymentReportQuerySchema), reportController.payments);
router.get("/tax", validateQuery(taxReportQuerySchema), reportController.tax);
router.get("/monthly-summary", validateQuery(monthlySummaryReportQuerySchema), reportController.monthlySummary);

export default router;
