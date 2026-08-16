import { z } from "zod";

// `format` (?format=csv|excel|pdf) is folded into the shared base schema so
// every report - the original four AND every one added below - gets export
// support for free from a single change, rather than repeating this on each
// report's schema. When omitted the controller returns the normal JSON body
// (unchanged behavior for every existing caller).
const reportDateRangeQuerySchema = z
  .object({
    preset: z.enum(["TODAY", "THIS_WEEK", "THIS_MONTH", "THIS_QUARTER", "THIS_YEAR", "CUSTOM"]).default("THIS_MONTH"),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    format: z.enum(["csv", "excel", "pdf"]).optional()
  })
  .refine(data => data.preset !== "CUSTOM" || (data.from && data.to), {
    message: "from and to are required when preset is CUSTOM",
    path: ["from"]
  })
  .refine(data => data.preset !== "CUSTOM" || !data.from || !data.to || data.from <= data.to, {
    message: "from must be on or before to",
    path: ["to"]
  });

export const salesReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({ customerId: z.string().trim().min(1).optional() })
);

export const profitLossReportQuerySchema = reportDateRangeQuerySchema;

export const outstandingBalanceReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({ customerId: z.string().trim().min(1).optional() })
);

export const customerReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({ customerId: z.string().trim().min(1).optional() })
);

// -----------------------------------------------------------------------------
// Newly added reports (Supplier, Product, Invoice, Expense, Income, Payment,
// Tax, Monthly Summary) - same base date-range/export schema, `.and()`-ed
// with each report's own optional filters, exactly like the four above.
// -----------------------------------------------------------------------------

export const supplierReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({ supplierId: z.string().trim().min(1).optional() })
);

export const productReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({
    productId: z.string().trim().min(1).optional(),
    categoryId: z.string().trim().min(1).optional()
  })
);

export const invoiceReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({
    customerId: z.string().trim().min(1).optional(),
    status: z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]).optional()
  })
);

export const expenseReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({
    supplierId: z.string().trim().min(1).optional(),
    expenseCategoryId: z.string().trim().min(1).optional()
  })
);

export const incomeReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({
    customerId: z.string().trim().min(1).optional(),
    incomeCategoryId: z.string().trim().min(1).optional()
  })
);

export const paymentReportQuerySchema = reportDateRangeQuerySchema.and(
  z.object({
    type: z.enum(["RECEIVED", "PAID"]).optional(),
    status: z.enum(["PENDING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
    customerId: z.string().trim().min(1).optional(),
    supplierId: z.string().trim().min(1).optional()
  })
);

export const taxReportQuerySchema = reportDateRangeQuerySchema;

// Monthly Summary ignores CUSTOM from/to granularity (it always buckets by
// calendar month) but keeps `preset` so "This Year" / "This Quarter" still
// controls how many months are shown - defaulted to THIS_YEAR in the
// service layer rather than here, since THIS_MONTH (the shared default)
// would produce a one-month summary, which defeats the report's purpose.
export const monthlySummaryReportQuerySchema = reportDateRangeQuerySchema;

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;
export type ProfitLossReportQuery = z.infer<typeof profitLossReportQuerySchema>;
export type OutstandingBalanceReportQuery = z.infer<typeof outstandingBalanceReportQuerySchema>;
export type CustomerReportQuery = z.infer<typeof customerReportQuerySchema>;
export type SupplierReportQuery = z.infer<typeof supplierReportQuerySchema>;
export type ProductReportQuery = z.infer<typeof productReportQuerySchema>;
export type InvoiceReportQuery = z.infer<typeof invoiceReportQuerySchema>;
export type ExpenseReportQuery = z.infer<typeof expenseReportQuerySchema>;
export type IncomeReportQuery = z.infer<typeof incomeReportQuerySchema>;
export type PaymentReportQuery = z.infer<typeof paymentReportQuerySchema>;
export type TaxReportQuery = z.infer<typeof taxReportQuerySchema>;
export type MonthlySummaryReportQuery = z.infer<typeof monthlySummaryReportQuerySchema>;