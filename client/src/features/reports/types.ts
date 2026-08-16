// Mirrors server/src/utils/exporters.ts's ExportFormat - every report hook
// accepts an optional `format`, which useReportExport (below) sets before
// requesting a blob instead of JSON.
export type ReportExportFormat = 'csv' | 'excel' | 'pdf'

// Mirrors server/src/utils/dateRange.ts's DateRangePreset - kept as a
// separate client-side type (not imported from the server) since this is a
// Next.js app with no shared package between client/server, same as every
// other status/enum union in features/*/types.ts (e.g. InvoiceStatus).
export type DateRangePreset = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM'

export type DateRangeParams = {
  preset?: DateRangePreset
  from?: string
  to?: string
}

export type ResolvedRange = {
  from: string
  to: string
}

// -----------------------------------------------------------------------------
// Sales Report
// -----------------------------------------------------------------------------

export type SalesReportParams = DateRangeParams & { customerId?: string }

export type SalesReportRow = {
  id: string
  invoiceNumber: string
  issueDate: string
  status: string
  totalAmount: number
  amountPaid: number
  customerId: string
  customerName: string
}

export type SalesTopProduct = {
  productId: string
  productName: string
  unitsSold: number
  revenue: number
}

export type SalesReport = {
  range: ResolvedRange
  summary: {
    totalSales: number
    invoiceCount: number
    averageInvoiceValue: number
  }
  trend: { day: string; total: number }[]
  topProducts: SalesTopProduct[]
  rows: SalesReportRow[]
}

// -----------------------------------------------------------------------------
// Profit & Loss Report
// -----------------------------------------------------------------------------

export type ProfitLossReportParams = DateRangeParams

export type ProfitLossReport = {
  range: ResolvedRange
  revenue: { paymentsReceived: number; otherIncome: number; total: number }
  expenses: { total: number; byCategory: { category: string; total: number }[] }
  netProfit: number
  profitMargin: number
}

// -----------------------------------------------------------------------------
// Outstanding Balance Report
// -----------------------------------------------------------------------------

export type OutstandingBalanceReportParams = DateRangeParams & { customerId?: string }

export type OutstandingBalanceByCustomer = {
  customerId: string
  customerName: string
  customerEmail: string | null
  invoiceCount: number
  outstanding: number
}

export type OutstandingInvoiceRow = {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: string
  outstanding: number
  customerId: string
  customerName: string
}

export type OutstandingBalanceReport = {
  range: ResolvedRange
  summary: { totalOutstanding: number; customerCount: number; invoiceCount: number }
  byCustomer: OutstandingBalanceByCustomer[]
  oldestInvoices: OutstandingInvoiceRow[]
}

// -----------------------------------------------------------------------------
// Customer Report
// -----------------------------------------------------------------------------

export type CustomerReportParams = DateRangeParams & { customerId?: string }

export type CustomerReportRow = {
  customerId: string
  customerName: string
  customerEmail: string | null
  isActive: boolean
  invoiceCount: number
  totalInvoiced: number
  totalCollected: number
  outstanding: number
}

export type CustomerReportDetail = {
  invoices: {
    id: string
    invoiceNumber: string
    issueDate: string
    status: string
    totalAmount: number
    amountPaid: number
  }[]
  payments: { id: string; amount: number; method: string; paymentDate: string; reference: string | null }[]
}

export type CustomerReport = {
  range: ResolvedRange
  rows: CustomerReportRow[]
  // All-time (not windowed by `range`) - reused from the same source as the
  // main Dashboard's "Top Customers" card. See report.service.ts's
  // getCustomerReport comment.
  topCustomers: { customerId: string; customerName: string; total: number }[]
  detail: CustomerReportDetail | null
}

// -----------------------------------------------------------------------------
// Supplier Report
// -----------------------------------------------------------------------------

export type SupplierReportParams = DateRangeParams & { supplierId?: string }

export type SupplierReportRow = {
  supplierId: string
  supplierName: string
  supplierEmail: string | null
  supplierPhone: string | null
  isActive: boolean
  expenseCount: number
  totalExpenses: number
  totalPaid: number
  openingBalance: number
  outstandingPayable: number
}

export type SupplierReport = {
  range: ResolvedRange
  summary: {
    totalExpenses: number
    totalPaid: number
    totalOutstandingPayable: number
    supplierCount: number
  }
  rows: SupplierReportRow[]
}

// -----------------------------------------------------------------------------
// Product Report
// -----------------------------------------------------------------------------

export type ProductReportParams = DateRangeParams & { productId?: string; categoryId?: string }

export type ProductReportRow = {
  productId: string
  productName: string
  sku: string | null
  categoryId: string | null
  categoryName: string | null
  price: number
  stockQuantity: number
  isActive: boolean
  unitsSold: number
  revenue: number
}

export type ProductReport = {
  range: ResolvedRange
  summary: { totalUnitsSold: number; totalRevenue: number; productCount: number }
  topProducts: { productId: string; productName: string; unitsSold: number; revenue: number }[]
  rows: ProductReportRow[]
}

// -----------------------------------------------------------------------------
// Invoice Report
// -----------------------------------------------------------------------------

export type InvoiceReportParams = DateRangeParams & { customerId?: string; status?: string }

export type InvoiceReportRow = {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: string
  totalAmount: number
  amountPaid: number
  balance: number
  customerId: string
  customerName: string
}

export type InvoiceReport = {
  range: ResolvedRange
  summary: { invoiceCount: number; totalAmount: number; totalPaid: number }
  statusBreakdown: { status: string; count: number; total: number }[]
  rows: InvoiceReportRow[]
}

// -----------------------------------------------------------------------------
// Expense Report
// -----------------------------------------------------------------------------

export type ExpenseReportParams = DateRangeParams & { supplierId?: string; expenseCategoryId?: string }

export type ExpenseReportRow = {
  id: string
  title: string
  category: string
  amount: number
  expenseDate: string
  paymentMethod: string
  supplierId: string | null
  supplierName: string | null
}

export type ExpenseReport = {
  range: ResolvedRange
  summary: { total: number; count: number }
  byCategory: { category: string; total: number }[]
  rows: ExpenseReportRow[]
}

// -----------------------------------------------------------------------------
// Income Report
// -----------------------------------------------------------------------------

export type IncomeReportParams = DateRangeParams & { customerId?: string; incomeCategoryId?: string }

export type IncomeReportRow = {
  id: string
  title: string
  category: string
  amount: number
  incomeDate: string
  method: string
  customerId: string | null
  customerName: string | null
}

export type IncomeReport = {
  range: ResolvedRange
  summary: { total: number; count: number }
  byCategory: { category: string; total: number }[]
  rows: IncomeReportRow[]
}

// -----------------------------------------------------------------------------
// Payment Report
// -----------------------------------------------------------------------------

export type PaymentReportParams = DateRangeParams & {
  type?: 'RECEIVED' | 'PAID'
  status?: string
  customerId?: string
  supplierId?: string
}

export type PaymentReportRow = {
  id: string
  amount: number
  method: string
  type: string
  status: string
  paymentDate: string
  reference: string | null
  customerId: string | null
  customerName: string | null
  supplierId: string | null
  supplierName: string | null
}

export type PaymentReport = {
  range: ResolvedRange
  summary: { totalReceived: number; receivedCount: number; totalPaid: number; paidCount: number }
  rows: PaymentReportRow[]
}

// -----------------------------------------------------------------------------
// Tax Report
// -----------------------------------------------------------------------------

export type TaxReportParams = DateRangeParams

export type TaxReportRow = {
  id: string
  invoiceNumber: string
  issueDate: string
  status: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  customerId: string
  customerName: string
}

export type TaxReport = {
  range: ResolvedRange
  summary: {
    invoiceCount: number
    totalTaxableAmount: number
    totalTaxCollected: number
    totalBilled: number
    effectiveTaxRate: number
  }
  rows: TaxReportRow[]
}

// -----------------------------------------------------------------------------
// Monthly Summary Report
// -----------------------------------------------------------------------------

export type MonthlySummaryReportParams = DateRangeParams

export type MonthlySummaryRow = {
  month: string
  label: string
  revenue: number
  expenses: number
  profit: number
  sales: number
  invoiceCount: number
}

export type MonthlySummaryReport = {
  range: ResolvedRange
  months: MonthlySummaryRow[]
  totals: { revenue: number; expenses: number; profit: number; sales: number; invoiceCount: number }
}
