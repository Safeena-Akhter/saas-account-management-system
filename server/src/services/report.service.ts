import * as reportRepo from "../repositories/report.repository";
import { topCustomers as dashboardTopCustomers } from "../repositories/dashboard.repository";
import { resolveDateRange, fillDays, fillMonths } from "../utils/dateRange";
import dayjs from "dayjs";
import type {
  CustomerReportQuery,
  ExpenseReportQuery,
  IncomeReportQuery,
  InvoiceReportQuery,
  MonthlySummaryReportQuery,
  OutstandingBalanceReportQuery,
  PaymentReportQuery,
  ProductReportQuery,
  ProfitLossReportQuery,
  SalesReportQuery,
  SupplierReportQuery,
  TaxReportQuery
} from "../validators/report.validator";

// -----------------------------------------------------------------------------
// Sales Report
// -----------------------------------------------------------------------------

export async function getSalesReport(companyId: string, query: SalesReportQuery) {
  const range = resolveDateRange(query);
  const { customerId } = query;

  const [summary, rows, trendRows, topProducts] = await Promise.all([
    reportRepo.salesSummary(companyId, range, customerId),
    reportRepo.salesRows(companyId, range, customerId),
    reportRepo.salesDailyTrend(companyId, range, customerId),
    reportRepo.topProductsBySales(companyId, range)
  ]);

  return {
    range,
    summary: {
      ...summary,
      averageInvoiceValue: summary.invoiceCount > 0 ? summary.totalSales / summary.invoiceCount : 0
    },
    trend: fillDays(trendRows, range),
    topProducts,
    rows: rows.map(row => ({
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      issueDate: row.issueDate,
      status: row.status,
      totalAmount: Number(row.totalAmount),
      amountPaid: Number(row.amountPaid),
      customerId: row.customer.id,
      customerName: row.customer.name
    }))
  };
}

// -----------------------------------------------------------------------------
// Profit & Loss Report
// -----------------------------------------------------------------------------

export async function getProfitLossReport(companyId: string, query: ProfitLossReportQuery) {
  const range = resolveDateRange(query);

  const [revenue, totalExpenses, expenseBreakdown] = await Promise.all([
    reportRepo.revenueForRange(companyId, range),
    reportRepo.expensesForRange(companyId, range),
    reportRepo.expenseBreakdownByCategory(companyId, range)
  ]);

  const totalRevenue = revenue.paymentsReceived + revenue.otherIncome;
  const netProfit = totalRevenue - totalExpenses;

  return {
    range,
    revenue: { ...revenue, total: totalRevenue },
    expenses: { total: totalExpenses, byCategory: expenseBreakdown },
    netProfit,
    // 0 revenue -> 0% margin rather than NaN/Infinity, so the UI never has
    // to special-case a divide-by-zero.
    profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  };
}

// -----------------------------------------------------------------------------
// Outstanding Balance Report
// -----------------------------------------------------------------------------

export async function getOutstandingBalanceReport(companyId: string, query: OutstandingBalanceReportQuery) {
  const range = resolveDateRange(query);
  const { customerId } = query;

  const [byCustomer, oldestInvoices] = await Promise.all([
    reportRepo.outstandingBalanceByCustomer(companyId, range, customerId),
    reportRepo.oldestOutstandingInvoices(companyId, range, customerId)
  ]);

  const totalOutstanding = byCustomer.reduce((sum, row) => sum + row.outstanding, 0);
  const totalInvoiceCount = byCustomer.reduce((sum, row) => sum + row.invoiceCount, 0);

  return {
    range,
    summary: { totalOutstanding, customerCount: byCustomer.length, invoiceCount: totalInvoiceCount },
    byCustomer,
    oldestInvoices: oldestInvoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      status: inv.status,
      outstanding: Number(inv.totalAmount) - Number(inv.amountPaid),
      customerId: inv.customer.id,
      customerName: inv.customer.name
    }))
  };
}

// -----------------------------------------------------------------------------
// Customer Report
// -----------------------------------------------------------------------------

export async function getCustomerReport(companyId: string, query: CustomerReportQuery) {
  const range = resolveDateRange(query);
  const { customerId } = query;

  // All-time (not windowed - reused as-is from the dashboard, which is
  // deliberately an always-on "who are our biggest customers" view rather
  // than a period one) - feeds the Customer Report's Top Customers chart.
  const [rows, topCustomers] = await Promise.all([
    reportRepo.customerSummaryRows(companyId, range, customerId),
    dashboardTopCustomers(companyId, 5)
  ]);

  // No drill-down for the multi-customer view - only fetch invoice/payment
  // detail rows when the caller asked for a single customer.
  if (!customerId || rows.length === 0) {
    return { range, rows, topCustomers, detail: null };
  }

  const [invoices, payments] = await Promise.all([
    reportRepo.customerInvoiceRows(companyId, customerId, range),
    reportRepo.customerPaymentRows(companyId, customerId, range)
  ]);

  return {
    range,
    rows,
    topCustomers,
    detail: {
      invoices: invoices.map(inv => ({
        ...inv,
        totalAmount: Number(inv.totalAmount),
        amountPaid: Number(inv.amountPaid)
      })),
      payments: payments.map(p => ({ ...p, amount: Number(p.amount) }))
    }
  };
}

// -----------------------------------------------------------------------------
// Supplier Report
// -----------------------------------------------------------------------------

export async function getSupplierReport(companyId: string, query: SupplierReportQuery) {
  const range = resolveDateRange(query);
  const { supplierId } = query;

  const rows = await reportRepo.supplierSummaryRows(companyId, range, supplierId);

  const summary = rows.reduce(
    (acc, row) => ({
      totalExpenses: acc.totalExpenses + row.totalExpenses,
      totalPaid: acc.totalPaid + row.totalPaid,
      totalOutstandingPayable: acc.totalOutstandingPayable + row.outstandingPayable
    }),
    { totalExpenses: 0, totalPaid: 0, totalOutstandingPayable: 0 }
  );

  return { range, summary: { ...summary, supplierCount: rows.length }, rows };
}

// -----------------------------------------------------------------------------
// Product Report
// -----------------------------------------------------------------------------

export async function getProductReport(companyId: string, query: ProductReportQuery) {
  const range = resolveDateRange(query);
  const { productId, categoryId } = query;

  const rows = await reportRepo.productSummaryRows(companyId, range, productId, categoryId);

  const summary = rows.reduce(
    (acc, row) => ({
      totalUnitsSold: acc.totalUnitsSold + row.unitsSold,
      totalRevenue: acc.totalRevenue + row.revenue
    }),
    { totalUnitsSold: 0, totalRevenue: 0 }
  );

  const topProducts = [...rows]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(r => ({ productId: r.productId, productName: r.productName, unitsSold: r.unitsSold, revenue: r.revenue }));

  return {
    range,
    summary: { ...summary, productCount: rows.length },
    topProducts,
    rows
  };
}

// -----------------------------------------------------------------------------
// Invoice Report
// -----------------------------------------------------------------------------

export async function getInvoiceReport(companyId: string, query: InvoiceReportQuery) {
  const range = resolveDateRange(query);
  const { customerId, status } = query;

  const [summary, rows, statusBreakdown] = await Promise.all([
    reportRepo.invoiceRegisterSummary(companyId, range, customerId, status),
    reportRepo.invoiceRegisterRows(companyId, range, customerId, status),
    reportRepo.invoiceStatusBreakdown(companyId, range, customerId)
  ]);

  return {
    range,
    summary,
    statusBreakdown,
    rows: rows.map(row => ({
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      status: row.status,
      totalAmount: Number(row.totalAmount),
      amountPaid: Number(row.amountPaid),
      balance: Number(row.totalAmount) - Number(row.amountPaid),
      customerId: row.customer.id,
      customerName: row.customer.name
    }))
  };
}

// -----------------------------------------------------------------------------
// Expense Report
// -----------------------------------------------------------------------------

export async function getExpenseReport(companyId: string, query: ExpenseReportQuery) {
  const range = resolveDateRange(query);
  const { supplierId, expenseCategoryId } = query;

  const [summary, rows, byCategory] = await Promise.all([
    reportRepo.expenseReportSummary(companyId, range, supplierId, expenseCategoryId),
    reportRepo.expenseRows(companyId, range, supplierId, expenseCategoryId),
    reportRepo.expenseReportByCategory(companyId, range, supplierId, expenseCategoryId)
  ]);

  return {
    range,
    summary,
    byCategory,
    rows: rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      amount: Number(row.amount),
      expenseDate: row.expenseDate,
      paymentMethod: row.paymentMethod,
      supplierId: row.supplier?.id ?? null,
      supplierName: row.supplier?.name ?? null
    }))
  };
}

// -----------------------------------------------------------------------------
// Income Report
// -----------------------------------------------------------------------------

export async function getIncomeReport(companyId: string, query: IncomeReportQuery) {
  const range = resolveDateRange(query);
  const { customerId, incomeCategoryId } = query;

  const [summary, rows, byCategory] = await Promise.all([
    reportRepo.incomeReportSummary(companyId, range, customerId, incomeCategoryId),
    reportRepo.incomeRows(companyId, range, customerId, incomeCategoryId),
    reportRepo.incomeReportByCategory(companyId, range, customerId, incomeCategoryId)
  ]);

  return {
    range,
    summary,
    byCategory,
    rows: rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      amount: Number(row.amount),
      incomeDate: row.incomeDate,
      method: row.method,
      customerId: row.customer?.id ?? null,
      customerName: row.customer?.name ?? null
    }))
  };
}

// -----------------------------------------------------------------------------
// Payment Report
// -----------------------------------------------------------------------------

export async function getPaymentReport(companyId: string, query: PaymentReportQuery) {
  const range = resolveDateRange(query);
  const { type, status, customerId, supplierId } = query;

  const [summary, rows] = await Promise.all([
    reportRepo.paymentReportSummary(companyId, range, customerId, supplierId),
    reportRepo.paymentReportRows(companyId, range, type, status, customerId, supplierId)
  ]);

  return {
    range,
    summary,
    rows: rows.map(row => ({
      id: row.id,
      amount: Number(row.amount),
      method: row.method,
      type: row.type,
      status: row.status,
      paymentDate: row.paymentDate,
      reference: row.reference,
      customerId: row.customer?.id ?? null,
      customerName: row.customer?.name ?? null,
      supplierId: row.supplier?.id ?? null,
      supplierName: row.supplier?.name ?? null
    }))
  };
}

// -----------------------------------------------------------------------------
// Tax Report
// -----------------------------------------------------------------------------

export async function getTaxReport(companyId: string, query: TaxReportQuery) {
  const range = resolveDateRange(query);

  const [summary, rows] = await Promise.all([
    reportRepo.taxSummary(companyId, range),
    reportRepo.taxInvoiceRows(companyId, range)
  ]);

  return {
    range,
    summary: {
      ...summary,
      // 0 taxable amount -> 0% effective rate rather than NaN, same
      // divide-by-zero guard as Profit & Loss's profitMargin.
      effectiveTaxRate: summary.totalTaxableAmount > 0 ? (summary.totalTaxCollected / summary.totalTaxableAmount) * 100 : 0
    },
    rows: rows.map(row => ({
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      issueDate: row.issueDate,
      status: row.status,
      subtotal: Number(row.subtotal),
      taxAmount: Number(row.taxAmount),
      totalAmount: Number(row.totalAmount),
      customerId: row.customer.id,
      customerName: row.customer.name
    }))
  };
}

// -----------------------------------------------------------------------------
// Monthly Summary Report
// -----------------------------------------------------------------------------

// Defaults to THIS_YEAR (not the shared THIS_MONTH default every other
// report uses) - a one-month window would defeat the point of a *monthly*
// summary. THIS_MONTH/THIS_WEEK/TODAY presets still work if explicitly
// requested, they just produce a shorter (even one-bucket) table.
export async function getMonthlySummaryReport(companyId: string, query: MonthlySummaryReportQuery) {
  const range = query.preset ? resolveDateRange(query) : resolveDateRange({ ...query, preset: "THIS_YEAR" });

  const [revenueRows, expenseRows, salesRows, invoiceCountRows] = await Promise.all([
    reportRepo.monthlyRevenueSeries(companyId, range),
    reportRepo.monthlyExpenseSeries(companyId, range),
    reportRepo.monthlySalesSeries(companyId, range),
    reportRepo.monthlyInvoiceCountSeries(companyId, range)
  ]);

  const revenue = fillMonths(revenueRows, range);
  const expenses = fillMonths(expenseRows, range);
  const sales = fillMonths(salesRows, range);
  const invoiceCounts = fillMonths(invoiceCountRows, range);

  const expensesByMonth = new Map(expenses.map(e => [e.month, e.total]));
  const salesByMonth = new Map(sales.map(s => [s.month, s.total]));
  const invoiceCountByMonth = new Map(invoiceCounts.map(i => [i.month, i.total]));

  const months = revenue.map(r => {
    const expenseTotal = expensesByMonth.get(r.month) ?? 0;

    return {
      month: r.month,
      label: dayjs(`${r.month}-01`).format("MMM YYYY"),
      revenue: r.total,
      expenses: expenseTotal,
      profit: r.total - expenseTotal,
      sales: salesByMonth.get(r.month) ?? 0,
      invoiceCount: invoiceCountByMonth.get(r.month) ?? 0
    };
  });

  const totals = months.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.revenue,
      expenses: acc.expenses + m.expenses,
      profit: acc.profit + m.profit,
      sales: acc.sales + m.sales,
      invoiceCount: acc.invoiceCount + m.invoiceCount
    }),
    { revenue: 0, expenses: 0, profit: 0, sales: 0, invoiceCount: 0 }
  );

  return { range, months, totals };
}
