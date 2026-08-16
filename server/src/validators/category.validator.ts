import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  description: z.string().trim().max(500).nullable().optional()
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(150).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    isActive: z.boolean().optional()
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

// GET /categories?search=...&isActive=...&sortBy=...&sortOrder=...&page=...&pageSize=...
// z.coerce because query string values arrive as strings even for numeric/
// boolean params - `?page=2` is `req.query.page === "2"`. Same shape as
// listCustomersQuerySchema/listSuppliersQuerySchema.
//
// pageSize's default (100) is generous rather than matching Customers' 200,
// since Category lists are typically much smaller than a customer roster -
// still comfortably covers the "no explicit params" callers (e.g. the
// Product form's category picker via useCategories()) without paging them.
export const listCategoriesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100)
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
