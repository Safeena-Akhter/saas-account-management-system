import { z } from "zod";

import { buildContactRecordSchemas } from "./contactRecord.validator";

const creditLimitSchema = z
  .number({ message: "Must be a number" })
  .nonnegative("Credit limit must be zero or greater")
  .max(999_999_999.99, "Value is too large");

// Customer opts into required phone and an extra `creditLimit` field (per
// module spec) - Supplier's shape, built from the same factory without
// these options, is completely unaffected.
const { create, update } = buildContactRecordSchemas({
  phoneRequired: true,
  extraCreateShape: { creditLimit: creditLimitSchema.default(0) },
  extraUpdateShape: { creditLimit: creditLimitSchema.optional() }
});

export const createCustomerSchema = create;
export const updateCustomerSchema = update;

// GET /customers?search=...&page=...&pageSize=...&isActive=...&sortBy=...&sortOrder=...
// z.coerce because query string values arrive as strings even for numeric/
// boolean params - `?page=2` is `req.query.page === "2"`.
//
// pageSize's default (200) is intentionally generous rather than matching
// Users' 10: GET /customers is also called with *no* query params at all by
// the customer-picker dropdowns in Invoices/Payments (see useCustomers()),
// which expect the full active roster back, not just the first page. The
// dedicated Customers directory page always passes its own explicit
// pageSize (10/25/50), so this default only matters for those legacy,
// unpaginated callers.
export const listCustomersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "email", "createdAt", "creditLimit"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200)
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
