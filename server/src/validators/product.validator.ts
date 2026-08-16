import { z } from "zod";

const priceSchema = z
  .number({ message: "Must be a number" })
  .nonnegative("Must be zero or greater")
  .max(999_999_999.99, "Value is too large");

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
  sku: z.string().trim().max(100).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().trim().url("Image must be a valid URL").max(2048).nullable().optional(),
  price: priceSchema,
  costPrice: priceSchema.nullable().optional(),
  stockQuantity: z.number({ message: "Must be a number" }).int("Must be a whole number").nonnegative().default(0),
  categoryId: z.string().trim().min(1, "Category is required")
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(200).optional(),
    sku: z.string().trim().max(100).nullable().optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    imageUrl: z.string().trim().url("Image must be a valid URL").max(2048).nullable().optional(),
    price: priceSchema.optional(),
    costPrice: priceSchema.nullable().optional(),
    stockQuantity: z.number({ message: "Must be a number" }).int("Must be a whole number").nonnegative().optional(),
    categoryId: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional()
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
