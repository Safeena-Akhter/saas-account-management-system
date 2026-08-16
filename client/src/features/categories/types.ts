// Mirrors server/src/services/category.service.ts's return shape.
export type Category = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  companyId: string
  createdAt: string
  updatedAt: string
  // Present on list rows (server includes _count.products via Prisma) -
  // absent on the plain create/update mutation responses, which return the
  // bare category row. Optional so both shapes satisfy this one type.
  _count?: { products: number }
}

export type CreateCategoryInput = {
  name: string
  description?: string | null
}

export type UpdateCategoryInput = Partial<{
  name: string
  description: string | null
  isActive: boolean
}>

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CategoriesPage = {
  categories: Category[]
  pagination: Pagination
}

export type ListCategoriesParams = {
  search?: string
  isActive?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

// GET /categories/:id's response shape - the category record plus its live
// products count, for the Category Details view.
export type CategoryDetails = {
  category: Category
  productsCount: number
}
