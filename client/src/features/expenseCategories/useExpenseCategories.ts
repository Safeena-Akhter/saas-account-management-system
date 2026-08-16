import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import apiClient from '@/lib/api/client'
import type {
  ExpenseCategory,
  ExpenseCategoriesPage,
  ExpenseCategoryDetails,
  CreateExpenseCategoryInput,
  ListExpenseCategoriesParams,
  UpdateExpenseCategoryInput
} from './types'

export const expenseCategoryQueryKeys = {
  all: ['expense-categories'] as const,
  list: (params: ListExpenseCategoriesParams = {}) => ['expense-categories', 'list', params] as const,
  detail: (id: string) => ['expense-categories', 'detail', id] as const
}

export type ApiError = AxiosError<{ message?: string }>

// Full, unpaginated roster (server defaults pageSize to 100 - see
// listExpenseCategoriesQuerySchema's comment) - used by the Expense form's
// category picker, which expects a flat ExpenseCategory[] back. Mirrors
// useCustomers() in features/customers/useCustomers.ts.
//
// `enabled` lets a caller skip the request entirely for roles that can't
// manage expense categories - GET /expense-categories 403s for them per
// EXPENSE_MODULE_VIEW_ROLES, so there's no reason to even fire it.
export function useExpenseCategories(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: expenseCategoryQueryKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<ExpenseCategoriesPage>('/expense-categories')

      return data.categories
    },
    enabled: options.enabled ?? true
  })
}

// Paginated, searchable, sortable, filterable list - powers the Expense
// Categories manager dialog. Mirrors useCustomersDirectory().
export function useExpenseCategoriesDirectory(params: ListExpenseCategoriesParams = {}) {
  const { search, isActive, sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 10 } = params

  return useQuery({
    queryKey: expenseCategoryQueryKeys.list({ search, isActive, sortBy, sortOrder, page, pageSize }),
    queryFn: async () => {
      const { data } = await apiClient.get<ExpenseCategoriesPage>('/expense-categories', {
        params: {
          search: search || undefined,
          isActive,
          sortBy,
          sortOrder,
          page,
          pageSize
        }
      })

      return data
    },

    // Keeps the current page's rows on screen while the next page loads,
    // instead of flashing a loading skeleton on every click through search
    // results or pagination.
    placeholderData: keepPreviousData
  })
}

export function useExpenseCategoryDetails(id: string | undefined) {
  return useQuery({
    queryKey: expenseCategoryQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<ExpenseCategoryDetails>(`/expense-categories/${id}`)

      return data
    },
    enabled: Boolean(id)
  })
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation<ExpenseCategory, ApiError, CreateExpenseCategoryInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ category: ExpenseCategory }>('/expense-categories', input)

      return data.category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryQueryKeys.all })
    }
  })
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation<ExpenseCategory, ApiError, { id: string; input: UpdateExpenseCategoryInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ category: ExpenseCategory }>(`/expense-categories/${id}`, input)

      return data.category
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: expenseCategoryQueryKeys.detail(variables.id) })
    }
  })
}

// Separate from useUpdateExpenseCategory (which can also toggle isActive)
// so the UI can call a single-purpose "Activate" / "Deactivate" action that
// hits the dedicated PATCH /expense-categories/:id/activate|deactivate
// endpoints - same split as features/customers/useCustomers.ts.
export function useActivateExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation<ExpenseCategory, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ category: ExpenseCategory }>(`/expense-categories/${id}/activate`)

      return data.category
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: expenseCategoryQueryKeys.detail(id) })
    }
  })
}

export function useDeactivateExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation<ExpenseCategory, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ category: ExpenseCategory }>(`/expense-categories/${id}/deactivate`)

      return data.category
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: expenseCategoryQueryKeys.detail(id) })
    }
  })
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/expense-categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryQueryKeys.all })
    }
  })
}
