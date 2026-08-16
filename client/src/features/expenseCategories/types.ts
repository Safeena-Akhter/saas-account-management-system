// Mirrors server/src/services/expenseCategory.service.ts's return shape.
export type ExpenseCategory = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  companyId: string
  createdAt: string
  updatedAt: string

  // Present on list rows (server includes _count.expenses via Prisma) -
  // absent on the plain create/update mutation responses, which return the
  // bare category row. Optional so both shapes satisfy this one type.
  _count?: { expenses: number }
}

export type CreateExpenseCategoryInput = {
  name: string
  description?: string | null
}

export type UpdateExpenseCategoryInput = Partial<{
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

export type ExpenseCategoriesPage = {
  categories: ExpenseCategory[]
  pagination: Pagination
}

export type ListExpenseCategoriesParams = {
  search?: string
  isActive?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

// GET /expense-categories/:id's response shape - the category record plus its
// live expenses count, for the Expense Category Details view.
export type ExpenseCategoryDetails = {
  expenseCategory: ExpenseCategory
  expensesCount: number
}
