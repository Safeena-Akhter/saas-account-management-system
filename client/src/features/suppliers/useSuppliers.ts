import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  SuppliersPage,
  ListSuppliersParams,
  SupplierDetails
} from './types'

export const supplierQueryKeys = {
  all: ['suppliers'] as const,
  list: (params: ListSuppliersParams = {}) => ['suppliers', 'list', params] as const,
  detail: (id: string) => ['suppliers', 'detail', id] as const
}

// Full, unpaginated roster - unchanged contract from before pagination
// existed. Used by ExpensesTable's "pick a supplier" dropdown, which
// expects a flat Supplier[] back, not a paginated page. GET /suppliers
// defaults to a generous pageSize (200) server-side specifically so this
// call (no params) still returns everything a typical company has - see
// supplier.validator.ts's listSuppliersQuerySchema comment.
export function useSuppliers() {
  return useQuery({
    queryKey: supplierQueryKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<SuppliersPage>('/suppliers')

      return data.suppliers
    }
  })
}

// Paginated, searchable, sortable, filterable list - powers the main
// Suppliers directory table. Mirrors useCustomersDirectory().
export function useSuppliersDirectory(params: ListSuppliersParams = {}) {
  const { search, isActive, sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 10 } = params

  return useQuery({
    queryKey: supplierQueryKeys.list({ search, isActive, sortBy, sortOrder, page, pageSize }),
    queryFn: async () => {
      const { data } = await apiClient.get<SuppliersPage>('/suppliers', {
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
    placeholderData: keepPreviousData
  })
}

export function useSupplierDetails(id: string | undefined) {
  return useQuery({
    queryKey: supplierQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<SupplierDetails>(`/suppliers/${id}`)

      return data
    },
    enabled: Boolean(id)
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation<Supplier, ApiError, CreateSupplierInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ supplier: Supplier }>('/suppliers', input)

      return data.supplier
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all })
    }
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation<Supplier, ApiError, { id: string; input: UpdateSupplierInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ supplier: Supplier }>(`/suppliers/${id}`, input)

      return data.supplier
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.detail(variables.id) })
    }
  })
}

// Separate from useUpdateSupplier (which can also toggle isActive) so the
// UI can call a single-purpose "Activate" / "Deactivate" action that hits
// the dedicated PATCH /suppliers/:id/activate|deactivate endpoints - same
// split as features/customers/useCustomers.ts.
export function useActivateSupplier() {
  const queryClient = useQueryClient()

  return useMutation<Supplier, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ supplier: Supplier }>(`/suppliers/${id}/activate`)

      return data.supplier
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.detail(id) })
    }
  })
}

export function useDeactivateSupplier() {
  const queryClient = useQueryClient()

  return useMutation<Supplier, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ supplier: Supplier }>(`/suppliers/${id}/deactivate`)

      return data.supplier
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.detail(id) })
    }
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/suppliers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all })
    }
  })
}
