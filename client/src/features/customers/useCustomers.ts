import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomersPage,
  ListCustomersParams,
  CustomerDetails
} from './types'

export const customerQueryKeys = {
  all: ['customers'] as const,
  list: (params: ListCustomersParams = {}) => ['customers', 'list', params] as const,
  detail: (id: string) => ['customers', 'detail', id] as const
}

// Full, unpaginated roster - unchanged contract from before pagination
// existed. Used by the Invoices/Payments "pick a customer" dropdowns, which
// expect a flat Customer[] back, not a paginated page. GET /customers
// defaults to a generous pageSize (200) server-side specifically so this
// call (no params) still returns everything a typical company has - see
// customer.validator.ts's listCustomersQuerySchema comment.
export function useCustomers() {
  return useQuery({
    queryKey: customerQueryKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<CustomersPage>('/customers')

      return data.customers
    }
  })
}

// Paginated, searchable, sortable, filterable list - powers the main
// Customers directory table. Mirrors useCompanyUsers() in
// features/users/useUsers.ts.
export function useCustomersDirectory(params: ListCustomersParams = {}) {
  const { search, isActive, sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 10 } = params

  return useQuery({
    queryKey: customerQueryKeys.list({ search, isActive, sortBy, sortOrder, page, pageSize }),
    queryFn: async () => {
      const { data } = await apiClient.get<CustomersPage>('/customers', {
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

export function useCustomerDetails(id: string | undefined) {
  return useQuery({
    queryKey: customerQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerDetails>(`/customers/${id}`)

      return data
    },
    enabled: Boolean(id)
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation<Customer, ApiError, CreateCustomerInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ customer: Customer }>('/customers', input)

      return data.customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all })
    }
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation<Customer, ApiError, { id: string; input: UpdateCustomerInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ customer: Customer }>(`/customers/${id}`, input)

      return data.customer
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(variables.id) })
    }
  })
}

// Separate from useUpdateCustomer (which can also toggle isActive) so the
// UI can call a single-purpose "Activate" / "Deactivate" action that hits
// the dedicated PATCH /customers/:id/activate|deactivate endpoints,
// matching the backend's explicit activate/deactivate routes - same split
// as features/users/useUsers.ts.
export function useActivateCustomer() {
  const queryClient = useQueryClient()

  return useMutation<Customer, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ customer: Customer }>(`/customers/${id}/activate`)

      return data.customer
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(id) })
    }
  })
}

export function useDeactivateCustomer() {
  const queryClient = useQueryClient()

  return useMutation<Customer, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ customer: Customer }>(`/customers/${id}/deactivate`)

      return data.customer
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(id) })
    }
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/customers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all })
    }
  })
}
