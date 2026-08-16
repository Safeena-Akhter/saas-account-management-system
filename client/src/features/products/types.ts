// Mirrors server/src/repositories/product.repository.ts's `withCategory` include.
export type Product = {
  id: string
  name: string
  sku: string | null
  description: string | null
  imageUrl: string | null
  price: string // Prisma Decimal is serialized as a string over JSON
  costPrice: string | null
  stockQuantity: number
  isActive: boolean
  companyId: string
  categoryId: string
  category: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export type CreateProductInput = {
  name: string
  sku?: string | null
  description?: string | null
  imageUrl?: string | null
  price: number
  costPrice?: number | null
  stockQuantity: number
  categoryId: string
}

export type UpdateProductInput = Partial<{
  name: string
  sku: string | null
  description: string | null
  imageUrl: string | null
  price: number
  costPrice: number | null
  stockQuantity: number
  categoryId: string
  isActive: boolean
}>
