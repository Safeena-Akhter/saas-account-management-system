import { keepPreviousData, useQuery } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type {
  CustomerReport,
  CustomerReportParams,
  ExpenseReport,
  ExpenseReportParams,
  IncomeReport,
  IncomeReportParams,
  InvoiceReport,
  InvoiceReportParams,
  MonthlySummaryReport,
  MonthlySummaryReportParams,
  OutstandingBalanceReport,
  OutstandingBalanceReportParams,
  PaymentReport,
  PaymentReportParams,
  ProductReport,
  ProductReportParams,
  ProfitLossReport,
  ProfitLossReportParams,
  SalesReport,
  SalesReportParams,
  SupplierReport,
  SupplierReportParams,
  TaxReport,
  TaxReportParams
} from './types'

// All twelve reports share the query-key shape ['reports', <name>, params]
// so a future "refresh all reports" action could invalidate the whole
// ['reports'] prefix at once, same pattern as invoiceQueryKeys.
export const reportQueryKeys = {
  sales: (params: SalesReportParams = {}) => ['reports', 'sales', params] as const,
  profitLoss: (params: ProfitLossReportParams = {}) => ['reports', 'profit-loss', params] as const,
  outstandingBalance: (params: OutstandingBalanceReportParams = {}) =>
    ['reports', 'outstanding-balance', params] as const,
  customers: (params: CustomerReportParams = {}) => ['reports', 'customers', params] as const,
  suppliers: (params: SupplierReportParams = {}) => ['reports', 'suppliers', params] as const,
  products: (params: ProductReportParams = {}) => ['reports', 'products', params] as const,
  invoices: (params: InvoiceReportParams = {}) => ['reports', 'invoices', params] as const,
  expenses: (params: ExpenseReportParams = {}) => ['reports', 'expenses', params] as const,
  incomes: (params: IncomeReportParams = {}) => ['reports', 'incomes', params] as const,
  payments: (params: PaymentReportParams = {}) => ['reports', 'payments', params] as const,
  tax: (params: TaxReportParams = {}) => ['reports', 'tax', params] as const,
  monthlySummary: (params: MonthlySummaryReportParams = {}) => ['reports', 'monthly-summary', params] as const
}

// keepPreviousData on every report hook below: switching the date-range
// preset or a filter keeps last render's numbers on screen while the new
// range loads, instead of flashing the whole report to a loading skeleton -
// same UX invoiceDirectory/customerDirectory already use for pagination.

export function useSalesReport(params: SalesReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.sales(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: SalesReport }>('/reports/sales', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useProfitLossReport(params: ProfitLossReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.profitLoss(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: ProfitLossReport }>('/reports/profit-loss', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useOutstandingBalanceReport(params: OutstandingBalanceReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.outstandingBalance(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: OutstandingBalanceReport }>('/reports/outstanding-balance', {
        params
      })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useCustomerReport(params: CustomerReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.customers(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: CustomerReport }>('/reports/customers', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

// -----------------------------------------------------------------------------
// Newly added reports
// -----------------------------------------------------------------------------

export function useSupplierReport(params: SupplierReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.suppliers(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: SupplierReport }>('/reports/suppliers', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useProductReport(params: ProductReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.products(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: ProductReport }>('/reports/products', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useInvoiceReport(params: InvoiceReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.invoices(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: InvoiceReport }>('/reports/invoices', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useExpenseReport(params: ExpenseReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.expenses(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: ExpenseReport }>('/reports/expenses', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useIncomeReport(params: IncomeReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.incomes(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: IncomeReport }>('/reports/incomes', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function usePaymentReport(params: PaymentReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.payments(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: PaymentReport }>('/reports/payments', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useTaxReport(params: TaxReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.tax(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: TaxReport }>('/reports/tax', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}

export function useMonthlySummaryReport(params: MonthlySummaryReportParams = {}) {
  return useQuery({
    queryKey: reportQueryKeys.monthlySummary(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ report: MonthlySummaryReport }>('/reports/monthly-summary', { params })

      return data.report
    },
    placeholderData: keepPreviousData
  })
}
