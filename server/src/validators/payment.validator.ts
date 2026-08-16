import { z } from "zod";

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "CHEQUE", "ONLINE", "OTHER"] as const;

// A payment can be created as already-cleared (COMPLETED, the default and
// historically the only behavior) or logged as not-yet-cleared (PENDING -
// e.g. a cheque in hand but not yet banked). FAILED/CANCELLED are
// transition-only outcomes reached via PATCH /payments/:id/status, not
// something you'd pick at creation time.
const CREATABLE_STATUSES = ["PENDING", "COMPLETED"] as const;
const PAYMENT_STATUSES = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"] as const;

// Receive Customer Payment - unchanged shape from before (invoiceId/
// customerId, both optional/nullable), plus the new optional `status`.
export const createPaymentSchema = z.object({
  invoiceId: z.string().trim().min(1).nullable().optional(),
  customerId: z.string().trim().min(1).nullable().optional(),
  amount: z
    .number({ message: "Must be a number" })
    .positive("Amount must be greater than zero")
    .max(999_999_999.99, "Value is too large"),
  method: z.enum(PAYMENT_METHODS).default("CASH"),
  status: z.enum(CREATABLE_STATUSES).default("COMPLETED"),
  paymentDate: z.coerce.date().optional(),
  reference: z.string().trim().max(150).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional()
});

// Supplier Payment - money paid out to a supplier, paying down what the
// company owes them (see supplier.repository.ts's sumPaymentsForSupplier).
// No invoiceId/customerId here - suppliers don't have an invoice-equivalent
// in this schema (see Supplier.openingBalance's comment in schema.prisma).
export const createSupplierPaymentSchema = z.object({
  supplierId: z.string().trim().min(1, "Supplier is required"),
  amount: z
    .number({ message: "Must be a number" })
    .positive("Amount must be greater than zero")
    .max(999_999_999.99, "Value is too large"),
  method: z.enum(PAYMENT_METHODS).default("CASH"),
  status: z.enum(CREATABLE_STATUSES).default("COMPLETED"),
  paymentDate: z.coerce.date().optional(),
  reference: z.string().trim().max(150).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional()
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUSES)
});

// GET /payments?type=...&status=...&invoiceId=...&customerId=...&supplierId=...
// &search=...&dateFrom=...&dateTo=...&sortBy=...&sortOrder=...&page=...
// &pageSize=...
// pageSize defaults generously (200), same reasoning as
// listInvoiceQuerySchema: a caller with no explicit params (e.g. a
// "payments for this customer" picker) should still get everything, not
// just page 1.
export const listPaymentQuerySchema = z.object({
  type: z.enum(["RECEIVED", "PAID"]).optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  invoiceId: z.string().trim().min(1).optional(),
  customerId: z.string().trim().min(1).optional(),
  supplierId: z.string().trim().min(1).optional(),
  search: z.string().trim().max(200).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["paymentDate", "amount", "createdAt"]).default("paymentDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200)
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateSupplierPaymentInput = z.infer<typeof createSupplierPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type ListPaymentQuery = z.infer<typeof listPaymentQuerySchema>;
