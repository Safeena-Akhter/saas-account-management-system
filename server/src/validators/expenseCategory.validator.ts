import { z } from "zod";

// Mirrors category.validator.ts exactly (see that file for the reasoning
// behind each shape) - ExpenseCategory is a managed picker list for
// Expense.category, the same role Category plays for Product.category.
export const createExpenseCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  description: z.string().trim().max(500).nullable().optional()
});

export const updateExpenseCategorySchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(150).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    isActive: z.boolean().optional()
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

export const listExpenseCategoriesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100)
});

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
export type ListExpenseCategoriesQuery = z.infer<typeof listExpenseCategoriesQuerySchema>;
