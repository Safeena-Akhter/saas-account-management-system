import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import { invoiceQueryKeys } from '@/features/invoices/useInvoices'
import type {
  CreatePaymentInput,
  CreateSupplierPaymentInput,
  ListPaymentsParams,
  Payment,
  PaymentsPage,
  PaymentStatus
} from './types'

export const paymentQueryKeys = {
  // Full, unpaginated roster - kept as the exact `['payments']` key it
  // always was. Prefix-invalidation cascades to directory/detail below,
  // same reasoning as invoiceQueryKeys.list.
  list: ['payments'] as const,
  directory: (params: ListPaymentsParams = {}) => ['payments', 'directory', params] as const,
  detail: (id: string) => ['payments', 'detail', id] as const
}

export function usePayments() {
  return useQuery({
    queryKey: paymentQueryKeys.list,
    queryFn: async () => {
      const { data } = await apiClient.get<{ payments: Payment[] }>('/payments')

      return data.payments
    }
  })
}

// Paginated, searchable, sortable, filterable list - powers the Payment
// History table. Mirrors useInvoicesDirectory().
export function usePaymentsDirectory(params: ListPaymentsParams = {}) {
  const {
    type,
    status,
    invoiceId,
    customerId,
    supplierId,
    search,
    dateFrom,
    dateTo,
    sortBy = 'paymentDate',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10
  } = params

  return useQuery({
    queryKey: paymentQueryKeys.directory({
      type,
      status,
      invoiceId,
      customerId,
      supplierId,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page,
      pageSize
    }),
    queryFn: async () => {
      const { data } = await apiClient.get<PaymentsPage>('/payments', {
        params: {
          type,
          status,
          invoiceId,
          customerId,
          supplierId,
          search: search || undefined,
          dateFrom,
          dateTo,
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

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: paymentQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<{ payment: Payment }>(`/payments/${id}`)

      return data.payment
    },
    enabled: Boolean(id)
  })
}

// Receive Customer Payment - unchanged shape/behavior.
export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation<Payment, ApiError, CreatePaymentInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ payment: Payment }>('/payments', input)

      return data.payment
    },
    onSuccess: () => {
      // A payment can change an invoice's amountPaid/status, so both lists
      // need to be treated as stale, not just payments.
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.list })
    }
  })
}

// Supplier Payment - money paid out, paying down what's owed to a supplier.
// Doesn't touch any invoice, so no invoice cache invalidation needed - but
// does affect the Supplier Details page's outstandingPayable, which reads
// live from the server on its own query, so nothing else to invalidate
// here either.
export function useRecordSupplierPayment() {
  const queryClient = useQueryClient()

  return useMutation<Payment, ApiError, CreateSupplierPaymentInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ payment: Payment }>('/payments/supplier', input)

      return data.payment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.list })
    }
  })
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()

  return useMutation<Payment, ApiError, { id: string; status: PaymentStatus }>({
    mutationFn: async ({ id, status }) => {
      const { data } = await apiClient.patch<{ payment: Payment }>(`/payments/${id}/status`, { status })

      return data.payment
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.detail(variables.id) })

      // A status transition can move money in/out of an invoice's
      // amountPaid (see payment.service.ts#updatePaymentStatus).
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.list })
    }
  })
}
