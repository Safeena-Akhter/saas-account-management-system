import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import apiClient from '@/lib/api/client'
import type {
  IncomeCategory,
  IncomeCategoriesPage,
  IncomeCategoryDetails,
  CreateIncomeCategoryInput,
  ListIncomeCategoriesParams,
  UpdateIncomeCategoryInput
} from './types'

export const incomeCategoryQueryKeys = {
  all: ['income-categories'] as const,
  list: (params: ListIncomeCategoriesParams = {}) => ['income-categories', 'list', params] as const,
  detail: (id: string) => ['income-categories', 'detail', id] as const
}

export type ApiError = AxiosError<{ message?: string }>

// Full, unpaginated roster (server defaults pageSize to 100 - see
// listCategoriesQuerySchema's comment) - used by the Products form's
// category picker, which expects a flat IncomeCategory[] back. Mirrors
// useCustomers() in features/customers/useCustomers.ts.
//
// `enabled` lets a caller skip the request entirely (e.g. Employees on the
// Products page, who can view products but never touch the category
// picker - GET /categories now 403s for them per the IncomeCategory Management
// RBAC spec, so there's no reason to even fire it).
export function useIncomeCategories(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: incomeCategoryQueryKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<IncomeCategoriesPage>('/income-categories')

      return data.categories
    },
    enabled: options.enabled ?? true
  })
}

// Paginated, searchable, sortable, filterable list - powers the main
// Categories directory table. Mirrors useCustomersDirectory() in
// features/customers/useCustomers.ts.
export function useIncomeCategoriesDirectory(params: ListIncomeCategoriesParams = {}) {
  const { search, isActive, sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 10 } = params

  return useQuery({
    queryKey: incomeCategoryQueryKeys.list({ search, isActive, sortBy, sortOrder, page, pageSize }),
    queryFn: async () => {
      const { data } = await apiClient.get<IncomeCategoriesPage>('/income-categories', {
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

export function useIncomeCategoryDetails(id: string | undefined) {
  return useQuery({
    queryKey: incomeCategoryQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<IncomeCategoryDetails>(`/income-categories/${id}`)

      return data
    },
    enabled: Boolean(id)
  })
}

export function useCreateIncomeCategory() {
  const queryClient = useQueryClient()

  return useMutation<IncomeCategory, ApiError, CreateIncomeCategoryInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ category: IncomeCategory }>('/income-categories', input)

      return data.category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeCategoryQueryKeys.all })
    }
  })
}

export function useUpdateIncomeCategory() {
  const queryClient = useQueryClient()

  return useMutation<IncomeCategory, ApiError, { id: string; input: UpdateIncomeCategoryInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ category: IncomeCategory }>(`/income-categories/${id}`, input)

      return data.category
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: incomeCategoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: incomeCategoryQueryKeys.detail(variables.id) })
    }
  })
}

// Separate from useUpdateIncomeCategory (which can also toggle isActive)
// so the UI can call a single-purpose "Activate" / "Deactivate" action that
// hits the dedicated PATCH /income-categories/:id/activate|deactivate
// endpoints - same split as features/customers/useCustomers.ts.
export function useActivateIncomeCategory() {
  const queryClient = useQueryClient()

  return useMutation<IncomeCategory, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ category: IncomeCategory }>(`/income-categories/${id}/activate`)

      return data.category
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: incomeCategoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: incomeCategoryQueryKeys.detail(id) })
    }
  })
}

export function useDeactivateIncomeCategory() {
  const queryClient = useQueryClient()

  return useMutation<IncomeCategory, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ category: IncomeCategory }>(`/income-categories/${id}/deactivate`)

      return data.category
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: incomeCategoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: incomeCategoryQueryKeys.detail(id) })
    }
  })
}

export function useDeleteIncomeCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/income-categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeCategoryQueryKeys.all })
    }
  })
}
