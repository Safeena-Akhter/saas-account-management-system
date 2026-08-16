// Mirrors server/src/services/incomeCategory.service.ts's return shape.
export type IncomeCategory = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  companyId: string
  createdAt: string
  updatedAt: string

  // Present on list rows (server includes _count.incomes via Prisma) -
  // absent on the plain create/update mutation responses, which return the
  // bare category row. Optional so both shapes satisfy this one type.
  _count?: { incomes: number }
}

export type CreateIncomeCategoryInput = {
  name: string
  description?: string | null
}

export type UpdateIncomeCategoryInput = Partial<{
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

export type IncomeCategoriesPage = {
  categories: IncomeCategory[]
  pagination: Pagination
}

export type ListIncomeCategoriesParams = {
  search?: string
  isActive?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

// GET /income-categories/:id's response shape - the category record plus its
// live incomes count, for the Income Category Details view.
export type IncomeCategoryDetails = {
  incomeCategory: IncomeCategory
  incomesCount: number
}
