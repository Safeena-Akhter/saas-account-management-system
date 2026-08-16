import { z } from "zod";

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "CHEQUE", "ONLINE", "OTHER"] as const;

// Mirrors expense.validator.ts's shape throughout - Income is the "money
// in" peer of Expense's "money out", so the same field set (free-text
// category + optional category FK, amount, date, method, notes) applies,
// plus an optional customerId when this income is attributable to a
// specific customer (e.g. a misc cash sale recorded outside the normal
// Invoice flow).
export const createIncomeSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  category: z.string().trim().min(1, "Category is required").max(100),
  incomeCategoryId: z.string().trim().min(1).nullable().optional(),
  amount: z
    .number({ message: "Must be a number" })
    .positive("Amount must be greater than zero")
    .max(999_999_999.99, "Value is too large"),
  incomeDate: z.coerce.date().optional(),
  method: z.enum(PAYMENT_METHODS).default("CASH"),
  customerId: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional()
});

export const updateIncomeSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    incomeCategoryId: z.string().trim().min(1).nullable().optional(),
    amount: z.number({ message: "Must be a number" }).positive().max(999_999_999.99).optional(),
    incomeDate: z.coerce.date().optional(),
    method: z.enum(PAYMENT_METHODS).optional(),
    customerId: z.string().trim().min(1).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional()
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

export const listIncomesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  customerId: z.string().trim().min(1).optional(),
  incomeCategoryId: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["incomeDate", "amount", "title", "createdAt"]).default("incomeDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200)
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type ListIncomesQuery = z.infer<typeof listIncomesQuerySchema>;
