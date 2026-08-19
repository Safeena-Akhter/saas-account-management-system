import * as dash from "../repositories/dashboard.repository";
import { getMySubscription, getMyUsage } from "./subscription.service";

// Expiry Warning is considered "active" starting this many days out - same
// window as subscription.service.ts's EXPIRY_WARNING_WINDOW_DAYS, so the
// dashboard card and the expiry-warning notification agree on what counts
// as "expiring soon".
const EXPIRY_WARNING_DAYS = 3;

const CHART_MONTHS = 6;

function monthsAgo(n: number) {
  const d = new Date();

  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);

  return d;
}

// Rows come back sparse (only months that had activity) - this fills in
// every month in the window with 0 so charts don't have gaps.
function fillMonths(rows: { month: string; total: string }[], months: number) {
  const byMonth = new Map(rows.map(r => [r.month, Number(r.total)]));
  const result: { month: string; total: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = monthsAgo(i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    result.push({ month: key, total: byMonth.get(key) ?? 0 });
  }

  return result;
}

export async function getBusinessOwnerDashboard(companyId: string) {
  const since = monthsAgo(CHART_MONTHS - 1);

  const [
    revenue,
    expenses,
    outstanding,
    payable,
    pendingPayments,
    customers,
    suppliers,
    products,
    invoiceCount,
    revenueTrend,
    expenseTrend,
    salesTrend,
    topCustomers,
    recentActivities,
    subscription,
    usage
  ] = await Promise.all([
    dash.totalRevenue(companyId),
    dash.totalExpenses(companyId),
    dash.outstandingBalance(companyId),
    dash.outstandingPayable(companyId),
    dash.pendingPaymentsCount(companyId),
    dash.countCustomers(companyId),
    dash.countSuppliers(companyId),
    dash.countProducts(companyId),
    dash.countInvoicesByStatus(companyId, ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"]),
    dash.monthlyRevenue(companyId, since),
    dash.monthlyExpenses(companyId, since),
    dash.monthlySales(companyId, since),
    dash.topCustomers(companyId, 5),
    dash.recentActivities(companyId, 8),
    // "Current Plan Card" / "Subscription Status" / "Expiry Warning" /
    // "Feature Usage" / "Storage Usage" - Dashboard Integration per the
    // Subscription Management module spec. Reuses subscription.service.ts's
    // own Business-Owner functions rather than querying the subscription
    // repository directly here, so the dashboard card and the Subscription
    // page always agree on the numbers.
    getMySubscription(companyId),
    getMyUsage(companyId)
  ]);

  return {
    stats: {
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: revenue - expenses,
      customers,
      suppliers,
      products,
      invoices: invoiceCount,
      pendingPayments,
      outstandingBalance: outstanding,
      outstandingPayable: payable,
      monthlySales: fillMonths(salesTrend, 1)[0]?.total ?? 0
    },
    charts: {
      revenueTrend: fillMonths(revenueTrend, CHART_MONTHS),
      expenseTrend: fillMonths(expenseTrend, CHART_MONTHS),
      monthlySales: fillMonths(salesTrend, CHART_MONTHS),
      revenueVsExpense: fillMonths(revenueTrend, CHART_MONTHS).map((r, i) => ({
        month: r.month,
        revenue: r.total,
        expense: fillMonths(expenseTrend, CHART_MONTHS)[i]?.total ?? 0
      })),
      topCustomers,
      recentActivities
    },
    subscription: subscription
      ? {
          planName: subscription.plan.name,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          endDate: subscription.endDate,
          remainingDays: subscription.remainingDays,
          expiringSoon: subscription.status === "ACTIVE" && subscription.remainingDays <= EXPIRY_WARNING_DAYS,
          usage: usage?.usage ?? null
        }
      : null
  };
}

export async function getManagerDashboard(companyId: string) {
  const since = monthsAgo(CHART_MONTHS - 1);

  const [salesTrend, customers, products, invoiceCount, pendingApprovals, lowStockProducts, recentActivities] =
    await Promise.all([
      dash.monthlySales(companyId, since),
      dash.countCustomers(companyId),
      dash.countProducts(companyId),
      dash.countInvoicesByStatus(companyId, ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"]),
      dash.countInvoicesByStatus(companyId, ["SENT", "PARTIALLY_PAID", "OVERDUE"]),
      dash.countLowStockProducts(companyId),
      dash.recentActivities(companyId, 8)
    ]);

  return {
    stats: {
      sales: fillMonths(salesTrend, CHART_MONTHS).reduce((sum, m) => sum + m.total, 0),
      customers,
      products,
      invoices: invoiceCount,
      pendingApprovals,
      lowStockProducts
    },
    charts: {
      monthlySales: fillMonths(salesTrend, CHART_MONTHS),
      recentActivities
    }
  };
}

export async function getAccountantDashboard(companyId: string) {
  const since = monthsAgo(CHART_MONTHS - 1);

  const [revenue, expenses, revenueTrend, expenseTrend, pendingPayments, outstanding, payable, recentActivities] =
    await Promise.all([
      dash.totalRevenue(companyId),
      dash.totalExpenses(companyId),
      dash.monthlyRevenue(companyId, since),
      dash.monthlyExpenses(companyId, since),
      dash.pendingPaymentsCount(companyId),
      dash.outstandingBalance(companyId),
      dash.outstandingPayable(companyId),
      dash.recentActivities(companyId, 8)
    ]);

  return {
    stats: {
      income: revenue,
      expenses,
      netProfit: revenue - expenses,
      pendingPayments,
      outstandingBalance: outstanding,
      outstandingPayable: payable
    },
    charts: {
      revenueTrend: fillMonths(revenueTrend, CHART_MONTHS),
      expenseTrend: fillMonths(expenseTrend, CHART_MONTHS),
      recentActivities
    }
  };
}

export async function getEmployeeDashboard(companyId: string) {
  const [customers, invoiceCount, recentActivities] = await Promise.all([
    dash.countCustomers(companyId),
    dash.countInvoicesByStatus(companyId, ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"]),
    dash.recentActivities(companyId, 8)
  ]);

  return {
    stats: {
      customers,
      invoices: invoiceCount
    },
    charts: {
      recentActivities
    }
  };
}

export async function getSuperAdminDashboard() {
  const [
    companies,
    activeCompanies,
    suspendedCompanies,
    platformUsers,
    activePlatformUsers,
    activePlans,
    trialSubscriptions,
    expiredPlans,
    cancelledSubscriptions,
    platformRevenue,
    totalCustomers,
    totalSuppliers,
    totalProducts,
    totalInvoices,
    totalPayments,
    totalExpenses,
    totalIncome
  ] = await Promise.all([
    dash.countCompanies(),
    dash.countActiveCompanies(),
    dash.countSuspendedCompanies(),
    dash.countPlatformUsers(),
    dash.countActivePlatformUsers(),
    dash.countSubscriptionsByStatus("ACTIVE"),
    dash.countSubscriptionsByStatus("TRIAL"),
    dash.countSubscriptionsByStatus("EXPIRED"),
    dash.countSubscriptionsByStatus("CANCELLED"),
    dash.platformRevenue(),
    dash.countAllCustomers(),
    dash.countAllSuppliers(),
    dash.countAllProducts(),
    dash.countAllInvoices(),
    dash.sumAllPayments(),
    dash.sumAllExpenses(),
    dash.sumAllIncome()
  ]);

  return {
    stats: {
      companies,
      activeCompanies,
      suspendedCompanies,
      platformUsers,
      activePlatformUsers,
      activePlans,
      trialSubscriptions,
      expiredPlans,
      cancelledSubscriptions,
      platformRevenue,
      totalCustomers,
      totalSuppliers,
      totalProducts,
      totalInvoices,
      totalPayments,
      totalExpenses,
      totalIncome
    }
  };
}
