import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type {
  CreateInvoiceInput,
  Invoice,
  InvoicesPage,
  InvoiceStatus,
  ListInvoicesParams,
  UpdateInvoiceInput
} from './types'

export const invoiceQueryKeys = {
  // Full, unpaginated roster. Kept as the exact `['invoices']` key it
  // always was (not renamed to `.all`) because usePayments.ts invalidates
  // this same key after recording a payment - React Query's invalidation
  // is prefix-based, so invalidating `['invoices']` also cascades to
  // `.directory(...)` and `.detail(id)` below, which both nest under it.
  list: ['invoices'] as const,
  directory: (params: ListInvoicesParams = {}) => ['invoices', 'directory', params] as const,
  detail: (id: string) => ['invoices', 'detail', id] as const
}

// Full, unpaginated roster - unchanged contract from before pagination
// existed. Used by the Payments module's "which invoice is this payment
// against" dropdown (PaymentsTable.tsx), which expects a flat Invoice[]
// back, not a paginated page. GET /invoices defaults to a generous
// pageSize (200) server-side specifically so this call (no params) still
// returns everything a typical company has - see invoice.validator.ts's
// listInvoiceQuerySchema comment.
export function useInvoices() {
  return useQuery({
    queryKey: invoiceQueryKeys.list,
    queryFn: async () => {
      const { data } = await apiClient.get<{ invoices: Invoice[] }>('/invoices')

      return data.invoices
    }
  })
}

// Paginated, searchable, sortable, filterable list - powers the main
// Invoices directory table. Mirrors useCustomersDirectory().
export function useInvoicesDirectory(params: ListInvoicesParams = {}) {
  const { search, status, customerId, dueFrom, dueTo, sortBy = 'issueDate', sortOrder = 'desc', page = 1, pageSize = 10 } =
    params

  return useQuery({
    queryKey: invoiceQueryKeys.directory({ search, status, customerId, dueFrom, dueTo, sortBy, sortOrder, page, pageSize }),
    queryFn: async () => {
      const { data } = await apiClient.get<InvoicesPage>('/invoices', {
        params: {
          search: search || undefined,
          status,
          customerId,
          dueFrom,
          dueTo,
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

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: invoiceQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<{ invoice: Invoice }>(`/invoices/${id}`)

      return data.invoice
    },
    enabled: Boolean(id)
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation<Invoice, ApiError, CreateInvoiceInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ invoice: Invoice }>('/invoices', input)

      return data.invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.list })
    }
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation<Invoice, ApiError, { id: string; input: UpdateInvoiceInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ invoice: Invoice }>(`/invoices/${id}`, input)

      return data.invoice
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.detail(variables.id) })
    }
  })
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient()

  return useMutation<Invoice, ApiError, { id: string; status: InvoiceStatus }>({
    mutationFn: async ({ id, status }) => {
      const { data } = await apiClient.patch<{ invoice: Invoice }>(`/invoices/${id}/status`, { status })

      return data.invoice
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.detail(variables.id) })
    }
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/invoices/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.list })
    }
  })
}
