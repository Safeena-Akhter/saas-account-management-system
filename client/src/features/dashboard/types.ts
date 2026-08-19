export type TrendPoint = { month: string; total: number }
export type RevenueVsExpensePoint = { month: string; revenue: number; expense: number }
export type TopCustomer = { customerId: string; customerName: string; total: number }
export type Activity = {
  id: string
  type: 'invoice' | 'payment' | 'supplier_payment' | 'expense' | 'income' | 'customer'
  label: string
  amount: number | null
  createdAt: string
}

// Dashboard Integration per the Subscription Management module spec:
// "Current Plan Card" / "Subscription Status" / "Expiry Warning" /
// "Feature Usage" / "Storage Usage". Mirrors what
// server/src/services/dashboard.service.ts's getBusinessOwnerDashboard now
// attaches alongside stats/charts. `usage` reuses the same
// Record<LimitedResource, UsageEntry> shape as
// features/subscriptions/types.ts's UsageSummary, so the dashboard card and
// the full Subscription page render identical numbers from the same shape.
export type DashboardSubscription = {
  planName: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  billingCycle: 'MONTHLY' | 'YEARLY'
  endDate: string
  remainingDays: number
  expiringSoon: boolean
  usage: Record<string, { used: number; limit: number | null; percentUsed: number }> | null
}

export type BusinessOwnerDashboard = {
  stats: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    customers: number
    suppliers: number
    products: number
    invoices: number
    pendingPayments: number
    outstandingBalance: number
    outstandingPayable: number
    monthlySales: number
  }
  charts: {
    revenueTrend: TrendPoint[]
    expenseTrend: TrendPoint[]
    monthlySales: TrendPoint[]
    revenueVsExpense: RevenueVsExpensePoint[]
    topCustomers: TopCustomer[]
    recentActivities: Activity[]
  }
  subscription: DashboardSubscription | null
}

export type ManagerDashboard = {
  stats: {
    sales: number
    customers: number
    products: number
    invoices: number
    pendingApprovals: number
    lowStockProducts: number
  }
  charts: {
    monthlySales: TrendPoint[]
    recentActivities: Activity[]
  }
}

export type AccountantDashboard = {
  stats: {
    income: number
    expenses: number
    netProfit: number
    pendingPayments: number
    outstandingBalance: number
    outstandingPayable: number
  }
  charts: {
    revenueTrend: TrendPoint[]
    expenseTrend: TrendPoint[]
    recentActivities: Activity[]
  }
}

export type EmployeeDashboard = {
  stats: {
    customers: number
    invoices: number
  }
  charts: {
    recentActivities: Activity[]
  }
}

export type SuperAdminDashboard = {
  stats: {
    companies: number
    activeCompanies: number
    suspendedCompanies: number
    platformUsers: number
    activePlatformUsers: number
    activePlans: number
    trialSubscriptions: number
    expiredPlans: number
    cancelledSubscriptions: number
    platformRevenue: number
    totalCustomers: number
    totalSuppliers: number
    totalProducts: number
    totalInvoices: number
    totalPayments: number
    totalExpenses: number
    totalIncome: number
  }
}

export type AnyDashboard =
  | BusinessOwnerDashboard
  | ManagerDashboard
  | AccountantDashboard
  | EmployeeDashboard
  | SuperAdminDashboard
