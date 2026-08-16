import { z } from "zod";

import { buildContactRecordSchemas } from "./contactRecord.validator";

const openingBalanceSchema = z
  .number({ message: "Must be a number" })
  .nonnegative("Opening balance must be zero or greater")
  .max(999_999_999.99, "Value is too large");

// Supplier opts into required phone and an extra `openingBalance` field
// (per module spec) - same factory Customer uses, with its own options so
// the two shapes can't silently drift apart. See
// customer.validator.ts's creditLimitSchema for the equivalent on that side.
const { create, update } = buildContactRecordSchemas({
  phoneRequired: true,
  extraCreateShape: { openingBalance: openingBalanceSchema.default(0) },
  extraUpdateShape: { openingBalance: openingBalanceSchema.optional() }
});

export const createSupplierSchema = create;
export const updateSupplierSchema = update;

// GET /suppliers?search=...&page=...&pageSize=...&isActive=...&sortBy=...&sortOrder=...
// Mirrors listCustomersQuerySchema. pageSize's generous default (200)
// matters for useSuppliers() - the unpaginated "pick a supplier" dropdown
// in ExpensesTable, which calls GET /suppliers with no query params at all
// and expects the full roster back. The dedicated Suppliers directory page
// always passes its own explicit pageSize (10/25/50).
export const listSuppliersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "email", "createdAt", "openingBalance"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200)
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>;
