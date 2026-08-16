import { z } from "zod";

// Shared by create/update - every one of the Feature Limits fields is
// nullable (omit or pass null = unlimited, per schema.prisma's comment on
// Plan). z.coerce is deliberately NOT used here: these arrive as JSON body
// fields (not query-string text), so a caller sending "10" instead of 10
// is a validation bug in the caller, not something to silently coerce.
const limitsShape = {
  maxUsers: z.number().int().nonnegative().nullable().optional(),
  maxCustomers: z.number().int().nonnegative().nullable().optional(),
  maxSuppliers: z.number().int().nonnegative().nullable().optional(),
  maxProducts: z.number().int().nonnegative().nullable().optional(),
  maxCategories: z.number().int().nonnegative().nullable().optional(),
  maxInvoices: z.number().int().nonnegative().nullable().optional(),
  maxMonthlyReports: z.number().int().nonnegative().nullable().optional(),
  storageLimitMb: z.number().int().nonnegative().nullable().optional(),
  uploadLimitMb: z.number().int().nonnegative().nullable().optional(),
  // Future-ready per the module spec - accepted and stored, but nothing in
  // the app enforces it yet (there's no API rate limiter to check it
  // against).
  apiRequestLimit: z.number().int().nonnegative().nullable().optional()
};

export const createPlanSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).nullable().optional(),
  monthlyPrice: z.number({ message: "Must be a number" }).nonnegative().max(9_999_999.99),
  yearlyPrice: z.number({ message: "Must be a number" }).nonnegative().max(9_999_999.99),
  // Ordered bullet points for the pricing page - an array (not the old
  // delimited string) so order is preserved and no item needs escaping.
  features: z.array(z.string().trim().min(1).max(200)).max(50).nullable().optional(),
  ...limitsShape
});

export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    monthlyPrice: z.number({ message: "Must be a number" }).nonnegative().max(9_999_999.99).optional(),
    yearlyPrice: z.number({ message: "Must be a number" }).nonnegative().max(9_999_999.99).optional(),
    features: z.array(z.string().trim().min(1).max(200)).max(50).nullable().optional(),
    isActive: z.boolean().optional(),
    ...limitsShape
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
