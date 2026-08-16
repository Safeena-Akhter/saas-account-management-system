import { z } from "zod";

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "CHEQUE", "ONLINE", "OTHER"] as const;

export const createExpenseSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  category: z.string().trim().min(1, "Category is required").max(100),
  // Optional link to a managed ExpenseCategory row (see
  // expenseCategory.validator.ts). When provided, expense.service.ts
  // overwrites `category` with the category's own name, so the two never
  // drift apart - the free-text `category` above stays the source of
  // truth for display/back-compat, this is purely additive.
  expenseCategoryId: z.string().trim().min(1).nullable().optional(),
  amount: z
    .number({ message: "Must be a number" })
    .positive("Amount must be greater than zero")
    .max(999_999_999.99, "Value is too large"),
  expenseDate: z.coerce.date().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default("CASH"),
  supplierId: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional()
});

export const updateExpenseSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    expenseCategoryId: z.string().trim().min(1).nullable().optional(),
    amount: z.number({ message: "Must be a number" }).positive().max(999_999_999.99).optional(),
    expenseDate: z.coerce.date().optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    supplierId: z.string().trim().min(1).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional()
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

// GET /expenses?search=...&supplierId=...&expenseCategoryId=...&dateFrom=...
// &dateTo=...&sortBy=...&sortOrder=...&page=...&pageSize=...
// Same shape as listCustomersQuerySchema/listCategoriesQuerySchema.
export const listExpensesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  supplierId: z.string().trim().min(1).optional(),
  expenseCategoryId: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["expenseDate", "amount", "title", "createdAt"]).default("expenseDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200)
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
