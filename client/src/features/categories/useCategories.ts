import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import apiClient from '@/lib/api/client'
import type {
  Category,
  CategoriesPage,
  CategoryDetails,
  CreateCategoryInput,
  ListCategoriesParams,
  UpdateCategoryInput
} from './types'

export const categoryQueryKeys = {
  all: ['categories'] as const,
  list: (params: ListCategoriesParams = {}) => ['categories', 'list', params] as const,
  detail: (id: string) => ['categories', 'detail', id] as const
}

export type ApiError = AxiosError<{ message?: string }>

// Full, unpaginated roster (server defaults pageSize to 100 - see
// listCategoriesQuerySchema's comment) - used by the Products form's
// category picker, which expects a flat Category[] back. Mirrors
// useCustomers() in features/customers/useCustomers.ts.
//
// `enabled` lets a caller skip the request entirely (e.g. Employees on the
// Products page, who can view products but never touch the category
// picker - GET /categories now 403s for them per the Category Management
// RBAC spec, so there's no reason to even fire it).
export function useCategories(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: categoryQueryKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<CategoriesPage>('/categories')

      return data.categories
    },
    enabled: options.enabled ?? true
  })
}

// Paginated, searchable, sortable, filterable list - powers the main
// Categories directory table. Mirrors useCustomersDirectory() in
// features/customers/useCustomers.ts.
export function useCategoriesDirectory(params: ListCategoriesParams = {}) {
  const { search, isActive, sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 10 } = params

  return useQuery({
    queryKey: categoryQueryKeys.list({ search, isActive, sortBy, sortOrder, page, pageSize }),
    queryFn: async () => {
      const { data } = await apiClient.get<CategoriesPage>('/categories', {
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

export function useCategoryDetails(id: string | undefined) {
  return useQuery({
    queryKey: categoryQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<CategoryDetails>(`/categories/${id}`)

      return data
    },
    enabled: Boolean(id)
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, ApiError, CreateCategoryInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ category: Category }>('/categories', input)

      return data.category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })
    }
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, ApiError, { id: string; input: UpdateCategoryInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ category: Category }>(`/categories/${id}`, input)

      return data.category
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.detail(variables.id) })
    }
  })
}

// Separate from useUpdateCategory (which can also toggle isActive) so the
// UI can call a single-purpose "Activate" / "Deactivate" action that hits
// the dedicated PATCH /categories/:id/activate|deactivate endpoints,
// matching the backend's explicit activate/deactivate routes - same split
// as features/customers/useCustomers.ts.
export function useActivateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ category: Category }>(`/categories/${id}/activate`)

      return data.category
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.detail(id) })
    }
  })
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ category: Category }>(`/categories/${id}/deactivate`)

      return data.category
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.detail(id) })
    }
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })
    }
  })
}
