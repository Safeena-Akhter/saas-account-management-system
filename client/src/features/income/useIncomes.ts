import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type { CreateIncomeInput, Income, IncomesPage, ListIncomesParams, UpdateIncomeInput } from './types'

export const incomeQueryKeys = {
  list: ['incomes'] as const,
  directory: (params: ListIncomesParams = {}) => ['incomes', 'directory', params] as const,
  detail: (id: string) => ['incomes', 'detail', id] as const
}

export function useIncomes() {
  return useQuery({
    queryKey: incomeQueryKeys.list,
    queryFn: async () => {
      const { data } = await apiClient.get<{ incomes: Income[] }>('/incomes')

      return data.incomes
    }
  })
}

// Paginated, searchable, sortable, filterable list - powers the Income
// History table. Mirrors useExpensesDirectory().
export function useIncomesDirectory(params: ListIncomesParams = {}) {
  const {
    search,
    customerId,
    incomeCategoryId,
    dateFrom,
    dateTo,
    sortBy = 'incomeDate',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10
  } = params

  return useQuery({
    queryKey: incomeQueryKeys.directory({
      search,
      customerId,
      incomeCategoryId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page,
      pageSize
    }),
    queryFn: async () => {
      const { data } = await apiClient.get<IncomesPage>('/incomes', {
        params: { search: search || undefined, customerId, incomeCategoryId, dateFrom, dateTo, sortBy, sortOrder, page, pageSize }
      })

      return data
    },
    placeholderData: keepPreviousData
  })
}

export function useIncome(id: string | undefined) {
  return useQuery({
    queryKey: incomeQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<{ income: Income }>(`/incomes/${id}`)

      return data.income
    },
    enabled: Boolean(id)
  })
}

export function useCreateIncome() {
  const queryClient = useQueryClient()

  return useMutation<Income, ApiError, CreateIncomeInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ income: Income }>('/incomes', input)

      return data.income
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeQueryKeys.list })
    }
  })
}

export function useUpdateIncome() {
  const queryClient = useQueryClient()

  return useMutation<Income, ApiError, { id: string; input: UpdateIncomeInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ income: Income }>(`/incomes/${id}`, input)

      return data.income
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: incomeQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: incomeQueryKeys.detail(variables.id) })
    }
  })
}

export function useDeleteIncome() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/incomes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeQueryKeys.list })
    }
  })
}
