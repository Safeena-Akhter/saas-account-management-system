import type { PaymentMethod } from '@/features/payments/types'

export type Income = {
  id: string
  title: string
  category: string
  amount: string
  incomeDate: string
  method: PaymentMethod
  notes: string | null
  customerId: string | null
  customer: { id: string; name: string } | null
  incomeCategoryId: string | null
  incomeCategory: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export type CreateIncomeInput = {
  title: string
  category: string
  incomeCategoryId?: string | null
  amount: number
  incomeDate?: string
  method: PaymentMethod
  customerId?: string | null
  notes?: string | null
}

export type UpdateIncomeInput = Partial<CreateIncomeInput>

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type IncomesPage = {
  incomes: Income[]
  pagination: Pagination
}

export type ListIncomesParams = {
  search?: string
  customerId?: string
  incomeCategoryId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'incomeDate' | 'amount' | 'title' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
