import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type { CreateExpenseInput, Expense, ExpensesPage, ListExpensesParams, UpdateExpenseInput } from './types'

export const expenseQueryKeys = {
  // Full, unpaginated roster - kept as the exact `['expenses']` key it
  // always was. Same "invalidating the prefix cascades to every nested
  // key" reasoning as invoiceQueryKeys.list (see
  // features/invoices/useInvoices.ts).
  list: ['expenses'] as const,
  directory: (params: ListExpensesParams = {}) => ['expenses', 'directory', params] as const,
  detail: (id: string) => ['expenses', 'detail', id] as const
}

export function useExpenses() {
  return useQuery({
    queryKey: expenseQueryKeys.list,
    queryFn: async () => {
      const { data } = await apiClient.get<{ expenses: Expense[] }>('/expenses')

      return data.expenses
    }
  })
}

// Paginated, searchable, sortable, filterable list - powers the Expenses
// directory table. Mirrors useInvoicesDirectory().
export function useExpensesDirectory(params: ListExpensesParams = {}) {
  const {
    search,
    supplierId,
    expenseCategoryId,
    dateFrom,
    dateTo,
    sortBy = 'expenseDate',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10
  } = params

  return useQuery({
    queryKey: expenseQueryKeys.directory({
      search,
      supplierId,
      expenseCategoryId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page,
      pageSize
    }),
    queryFn: async () => {
      const { data } = await apiClient.get<ExpensesPage>('/expenses', {
        params: { search: search || undefined, supplierId, expenseCategoryId, dateFrom, dateTo, sortBy, sortOrder, page, pageSize }
      })

      return data
    },
    placeholderData: keepPreviousData
  })
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: expenseQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<{ expense: Expense }>(`/expenses/${id}`)

      return data.expense
    },
    enabled: Boolean(id)
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation<Expense, ApiError, CreateExpenseInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ expense: Expense }>('/expenses', input)

      return data.expense
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.list })
    }
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation<Expense, ApiError, { id: string; input: UpdateExpenseInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ expense: Expense }>(`/expenses/${id}`, input)

      return data.expense
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.detail(variables.id) })
    }
  })
}

// Uploads a receipt file for an existing expense - separate from
// useUpdateExpense (JSON) since this sends multipart/form-data. Mirrors
// useUploadCompanyLogo() in features/company/useCompany.ts.
export function useUploadExpenseReceipt() {
  const queryClient = useQueryClient()

  return useMutation<Expense, ApiError, { id: string; file: File }>({
    mutationFn: async ({ id, file }) => {
      const formData = new FormData()

      formData.append('receipt', file)

      const { data } = await apiClient.post<{ expense: Expense }>(`/expenses/${id}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      return data.expense
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.detail(variables.id) })
    }
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/expenses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.list })
    }
  })
}
