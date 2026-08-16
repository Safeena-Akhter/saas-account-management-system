import type { PaymentMethod } from '@/features/payments/types'

export type Expense = {
  id: string
  title: string
  category: string
  amount: string
  expenseDate: string
  paymentMethod: PaymentMethod
  receiptUrl: string | null
  notes: string | null
  supplierId: string | null
  supplier: { id: string; name: string } | null
  expenseCategoryId: string | null
  expenseCategory: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export type CreateExpenseInput = {
  title: string
  category: string
  expenseCategoryId?: string | null
  amount: number
  expenseDate?: string
  paymentMethod: PaymentMethod
  supplierId?: string | null
  notes?: string | null
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ExpensesPage = {
  expenses: Expense[]
  pagination: Pagination
}

export type ListExpensesParams = {
  search?: string
  supplierId?: string
  expenseCategoryId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'expenseDate' | 'amount' | 'title' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
