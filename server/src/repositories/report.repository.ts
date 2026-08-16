import { Prisma } from "@prisma/client";
import type { InvoiceStatus, PaymentStatus, PaymentType } from "@prisma/client";
import { prisma } from "../config/db";

import { DAILY_GROUP_FORMAT, MONTHLY_GROUP_FORMAT, type ResolvedDateRange } from "../utils/dateRange";

// DATE_FORMAT()'s format string, embedded as literal SQL text (not a bound
// `?` parameter) via Prisma.raw(). Safe here specifically because
// DAILY_GROUP_FORMAT/MONTHLY_GROUP_FORMAT are hardcoded app constants, never
// user input - Prisma.raw() must never be used on anything that came from a
// request. This is required, not stylistic: MySQL's default
// ONLY_FULL_GROUP_BY sql_mode rejects `SELECT DATE_FORMAT(col, ?) ...
// GROUP BY DATE_FORMAT(col, ?)` with error 1055, because the query planner
// can't prove two *parameterized* DATE_FORMAT() calls are the same
// expression before parameters are bound - even though they'd bind to an
// identical value at runtime. Embedding the format as a literal (what
// dashboard.repository.ts's monthlyRevenue/monthlyExpenses/monthlySales
// already do, hence why those never hit this) sidesteps the ambiguity
// entirely.
const dailyFormatLiteral = () => Prisma.raw(`'${DAILY_GROUP_FORMAT}'`);
const monthlyFormatLiteral = () => Prisma.raw(`'${MONTHLY_GROUP_FORMAT}'`);

// -----------------------------------------------------------------------------
// Sales Report
// -----------------------------------------------------------------------------

// "Sales" = invoiced totals in the window, same definition dashboard.
// repository.ts's monthlySales uses (issueDate-based, excludes CANCELLED and
// soft-deleted invoices) - deliberately NOT payments-collected, so this
// report answers "what did we bill" rather than "what did we collect"
// (that's Profit & Loss's job).
export async function salesSummary(companyId: string, range: ResolvedDateRange, customerId?: string) {
  const result = await prisma.invoice.aggregate({
    where: {
      companyId,
      deletedAt: null,
      status: { not: "CANCELLED" },
      issueDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {})
    },
    _sum: { totalAmount: true },
    _count: true
  });

  return {
    totalSales: Number(result._sum.totalAmount ?? 0),
    invoiceCount: result._count
  };
}

export function salesRows(companyId: string, range: ResolvedDateRange, customerId?: string) {
  return prisma.invoice.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: { not: "CANCELLED" },
      issueDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {})
    },
    select: {
      id: true,
      invoiceNumber: true,
      issueDate: true,
      status: true,
      totalAmount: true,
      amountPaid: true,
      customer: { select: { id: true, name: true } }
    },
    orderBy: { issueDate: "desc" }
  });
}

export function salesDailyTrend(companyId: string, range: ResolvedDateRange, customerId?: string) {
  // Raw SQL for day-level grouping, matching the pattern dashboard.
  // repository.ts already uses for month-level grouping (Prisma has no
  // native "group by day/month" aggregation). customerId is appended as an
  // extra AND clause only when present, rather than building the whole
  // query dynamically, since it's the only report-specific filter here.
  if (customerId) {
    return prisma.$queryRaw<{ day: string; total: string }[]>`
      SELECT DATE_FORMAT(issueDate, ${dailyFormatLiteral()}) AS day, SUM(totalAmount) AS total
      FROM invoices
      WHERE companyId = ${companyId} AND deletedAt IS NULL AND status != 'CANCELLED'
        AND issueDate >= ${range.from} AND issueDate <= ${range.to} AND customerId = ${customerId}
      GROUP BY DATE_FORMAT(issueDate, ${dailyFormatLiteral()})
      ORDER BY day ASC
    `;
  }

  return prisma.$queryRaw<{ day: string; total: string }[]>`
    SELECT DATE_FORMAT(issueDate, ${dailyFormatLiteral()}) AS day, SUM(totalAmount) AS total
    FROM invoices
    WHERE companyId = ${companyId} AND deletedAt IS NULL AND status != 'CANCELLED'
      AND issueDate >= ${range.from} AND issueDate <= ${range.to}
    GROUP BY DATE_FORMAT(issueDate, ${dailyFormatLiteral()})
    ORDER BY day ASC
  `;
}

// Top products by revenue within the window, via InvoiceItem (which stores
// a precomputed `total` per line so this doesn't need to recompute
// quantity * unitPrice). Joins back through Invoice to apply the same
// company/date/status scope as the rest of this report.
export async function topProductsBySales(companyId: string, range: ResolvedDateRange, limit = 5) {
  const rows = await prisma.invoiceItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      invoice: {
        companyId,
        deletedAt: null,
        status: { not: "CANCELLED" },
        issueDate: { gte: range.from, lte: range.to }
      }
    },
    _sum: { total: true, quantity: true },
    orderBy: { _sum: { total: "desc" } },
    take: limit
  });

  const products = await prisma.product.findMany({
    where: { id: { in: rows.map(r => r.productId).filter((id): id is string => id !== null) } },
    select: { id: true, name: true }
  });

  const byId = new Map(products.map(p => [p.id, p.name]));

  return rows.map(r => ({
    productId: r.productId as string,
    productName: byId.get(r.productId as string) ?? "Unknown",
    unitsSold: r._sum.quantity ?? 0,
    revenue: Number(r._sum.total ?? 0)
  }));
}

// -----------------------------------------------------------------------------
// Profit & Loss Report
// -----------------------------------------------------------------------------

// Revenue side mirrors dashboard.repository.ts's totalRevenue exactly
// (Payment type=RECEIVED status=COMPLETED, plus Income), just windowed to
// the report's date range instead of all-time, so a P&L for "This Month"
// reconciles with the dashboard's all-time revenue tile shrinking to that
// same window.
export async function revenueForRange(companyId: string, range: ResolvedDateRange) {
  const [paymentsResult, incomeResult] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        companyId,
        type: "RECEIVED",
        status: "COMPLETED",
        paymentDate: { gte: range.from, lte: range.to }
      },
      _sum: { amount: true }
    }),
    prisma.income.aggregate({
      where: { companyId, incomeDate: { gte: range.from, lte: range.to } },
      _sum: { amount: true }
    })
  ]);

  return {
    paymentsReceived: Number(paymentsResult._sum.amount ?? 0),
    otherIncome: Number(incomeResult._sum.amount ?? 0)
  };
}

export async function expensesForRange(companyId: string, range: ResolvedDateRange) {
  const result = await prisma.expense.aggregate({
    where: { companyId, expenseDate: { gte: range.from, lte: range.to } },
    _sum: { amount: true }
  });

  return Number(result._sum.amount ?? 0);
}

// Expense breakdown by category label (the free-text `category` field,
// which every expense has, rather than expenseCategoryId, which is
// optional/nullable - see Expense model's comment on why `category` stays
// the canonical display label).
export async function expenseBreakdownByCategory(companyId: string, range: ResolvedDateRange) {
  const rows = await prisma.expense.groupBy({
    by: ["category"],
    where: { companyId, expenseDate: { gte: range.from, lte: range.to } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } }
  });

  return rows.map(r => ({ category: r.category, total: Number(r._sum.amount ?? 0) }));
}

// -----------------------------------------------------------------------------
// Outstanding Balance Report
// -----------------------------------------------------------------------------

// Per-customer outstanding balance for invoices *issued* within the window
// (see report.validator.ts's comment on this report's date semantics) but
// whose balance is the live, as-of-now amountPaid - i.e. an old unpaid
// invoice still counts today even though it was billed in a past window,
// as long as the window includes its issueDate.
export async function outstandingBalanceByCustomer(companyId: string, range: ResolvedDateRange, customerId?: string) {
  const rows = await prisma.invoice.groupBy({
    by: ["customerId"],
    where: {
      companyId,
      deletedAt: null,
      status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
      issueDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {})
    },
    _sum: { totalAmount: true, amountPaid: true },
    _count: true
  });

  const customers = await prisma.customer.findMany({
    where: { id: { in: rows.map(r => r.customerId) } },
    select: { id: true, name: true, email: true }
  });

  const byId = new Map(customers.map(c => [c.id, c]));

  return rows
    .map(r => {
      const customer = byId.get(r.customerId);
      const outstanding = Number(r._sum.totalAmount ?? 0) - Number(r._sum.amountPaid ?? 0);

      return {
        customerId: r.customerId,
        customerName: customer?.name ?? "Unknown",
        customerEmail: customer?.email ?? null,
        invoiceCount: r._count,
        outstanding
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding);
}

export function oldestOutstandingInvoices(companyId: string, range: ResolvedDateRange, customerId?: string, limit = 10) {
  return prisma.invoice.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
      issueDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {})
    },
    select: {
      id: true,
      invoiceNumber: true,
      issueDate: true,
      dueDate: true,
      status: true,
      totalAmount: true,
      amountPaid: true,
      customer: { select: { id: true, name: true } }
    },
    orderBy: { dueDate: "asc" },
    take: limit
  });
}

// -----------------------------------------------------------------------------
// Customer Report
// -----------------------------------------------------------------------------

// Per-customer activity summary within the window: invoiced (issueDate in
// range), collected (COMPLETED RECEIVED payments with paymentDate in
// range), and the customer's live running outstanding balance (all-time,
// same reasoning as outstandingBalanceByCustomer above - a balance doesn't
// reset at a report window boundary).
export async function customerSummaryRows(companyId: string, range: ResolvedDateRange, customerId?: string) {
  const customers = await prisma.customer.findMany({
    where: { companyId, ...(customerId ? { id: customerId } : {}) },
    select: { id: true, name: true, email: true, isActive: true }
  });

  if (customers.length === 0) return [];

  const customerIds = customers.map(c => c.id);

  const [invoiced, collected, outstanding] = await Promise.all([
    prisma.invoice.groupBy({
      by: ["customerId"],
      where: {
        companyId,
        deletedAt: null,
        status: { not: "CANCELLED" },
        issueDate: { gte: range.from, lte: range.to },
        customerId: { in: customerIds }
      },
      _sum: { totalAmount: true },
      _count: true
    }),
    prisma.payment.groupBy({
      by: ["customerId"],
      where: {
        companyId,
        type: "RECEIVED",
        status: "COMPLETED",
        paymentDate: { gte: range.from, lte: range.to },
        customerId: { in: customerIds }
      },
      _sum: { amount: true }
    }),
    prisma.invoice.groupBy({
      by: ["customerId"],
      where: {
        companyId,
        deletedAt: null,
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        customerId: { in: customerIds }
      },
      _sum: { totalAmount: true, amountPaid: true }
    })
  ]);

  const invoicedById = new Map(invoiced.map(r => [r.customerId, r]));
  const collectedById = new Map(collected.map(r => [r.customerId as string, r]));
  const outstandingById = new Map(
    outstanding.map(r => [r.customerId, Number(r._sum.totalAmount ?? 0) - Number(r._sum.amountPaid ?? 0)])
  );

  return customers.map(customer => ({
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    isActive: customer.isActive,
    invoiceCount: invoicedById.get(customer.id)?._count ?? 0,
    totalInvoiced: Number(invoicedById.get(customer.id)?._sum.totalAmount ?? 0),
    totalCollected: Number(collectedById.get(customer.id)?._sum.amount ?? 0),
    outstanding: outstandingById.get(customer.id) ?? 0
  }));
}

// Drill-down rows for a single customer's detail view - their invoices and
// payments within the window, shown alongside the summary row above.
export function customerInvoiceRows(companyId: string, customerId: string, range: ResolvedDateRange) {
  return prisma.invoice.findMany({
    where: {
      companyId,
      customerId,
      deletedAt: null,
      issueDate: { gte: range.from, lte: range.to }
    },
    select: { id: true, invoiceNumber: true, issueDate: true, status: true, totalAmount: true, amountPaid: true },
    orderBy: { issueDate: "desc" }
  });
}

export function customerPaymentRows(companyId: string, customerId: string, range: ResolvedDateRange) {
  return prisma.payment.findMany({
    where: {
      companyId,
      customerId,
      type: "RECEIVED",
      status: "COMPLETED",
      paymentDate: { gte: range.from, lte: range.to }
    },
    select: { id: true, amount: true, method: true, paymentDate: true, reference: true },
    orderBy: { paymentDate: "desc" }
  });
}

// -----------------------------------------------------------------------------
// Supplier Report
// -----------------------------------------------------------------------------

// Per-supplier activity within the window (expenses billed to them, payments
// made to them) alongside their live, all-time outstandingPayable - same
// "outstandingPayable = openingBalance - all-time COMPLETED PAID payments"
// definition supplier.service.ts's getSupplierDetails already uses, kept
// consistent here rather than re-derived.
export async function supplierSummaryRows(companyId: string, range: ResolvedDateRange, supplierId?: string) {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId, ...(supplierId ? { id: supplierId } : {}) },
    select: { id: true, name: true, email: true, phone: true, isActive: true, openingBalance: true }
  });

  if (suppliers.length === 0) return [];

  const ids = suppliers.map(s => s.id);

  const [expensesInRange, paidInRange, paidAllTime] = await Promise.all([
    prisma.expense.groupBy({
      by: ["supplierId"],
      where: { companyId, supplierId: { in: ids }, expenseDate: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
      _count: true
    }),
    prisma.payment.groupBy({
      by: ["supplierId"],
      where: {
        companyId,
        supplierId: { in: ids },
        type: "PAID",
        status: "COMPLETED",
        paymentDate: { gte: range.from, lte: range.to }
      },
      _sum: { amount: true }
    }),
    prisma.payment.groupBy({
      by: ["supplierId"],
      where: { companyId, supplierId: { in: ids }, type: "PAID", status: "COMPLETED" },
      _sum: { amount: true }
    })
  ]);

  const expensesById = new Map(expensesInRange.map(r => [r.supplierId, r]));
  const paidInRangeById = new Map(paidInRange.map(r => [r.supplierId as string, r]));
  const paidAllTimeById = new Map(paidAllTime.map(r => [r.supplierId as string, Number(r._sum.amount ?? 0)]));

  return suppliers.map(supplier => ({
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierEmail: supplier.email,
    supplierPhone: supplier.phone,
    isActive: supplier.isActive,
    expenseCount: expensesById.get(supplier.id)?._count ?? 0,
    totalExpenses: Number(expensesById.get(supplier.id)?._sum.amount ?? 0),
    totalPaid: Number(paidInRangeById.get(supplier.id)?._sum.amount ?? 0),
    openingBalance: Number(supplier.openingBalance),
    outstandingPayable: Number(supplier.openingBalance) - (paidAllTimeById.get(supplier.id) ?? 0)
  }));
}

// -----------------------------------------------------------------------------
// Product Report
// -----------------------------------------------------------------------------

// Units sold + revenue within the window, via InvoiceItem (same join/scope
// pattern as topProductsBySales above), alongside each product's current
// (not windowed - stock is a point-in-time fact, not a period one) price
// and stock level.
export async function productSummaryRows(
  companyId: string,
  range: ResolvedDateRange,
  productId?: string,
  categoryId?: string
) {
  const products = await prisma.product.findMany({
    where: {
      companyId,
      ...(productId ? { id: productId } : {}),
      ...(categoryId ? { categoryId } : {})
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stockQuantity: true,
      isActive: true,
      category: { select: { id: true, name: true } }
    }
  });

  if (products.length === 0) return [];

  const ids = products.map(p => p.id);

  const sales = await prisma.invoiceItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: ids },
      invoice: {
        companyId,
        deletedAt: null,
        status: { not: "CANCELLED" },
        issueDate: { gte: range.from, lte: range.to }
      }
    },
    _sum: { quantity: true, total: true }
  });

  const salesById = new Map(sales.map(s => [s.productId as string, s]));

  return products.map(product => ({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    categoryId: product.category?.id ?? null,
    categoryName: product.category?.name ?? null,
    price: Number(product.price),
    stockQuantity: product.stockQuantity,
    isActive: product.isActive,
    unitsSold: salesById.get(product.id)?._sum.quantity ?? 0,
    revenue: Number(salesById.get(product.id)?._sum.total ?? 0)
  }));
}

// -----------------------------------------------------------------------------
// Invoice Report
// -----------------------------------------------------------------------------

// Full invoice register for the window - unlike Sales Report's salesRows,
// this is NOT filtered to exclude CANCELLED by default (the register should
// show every invoice raised, cancelled ones included, unless the caller
// explicitly filters by status) - that's what distinguishes this report
// from Sales.
export function invoiceRegisterRows(
  companyId: string,
  range: ResolvedDateRange,
  customerId?: string,
  status?: InvoiceStatus
) {
  return prisma.invoice.findMany({
    where: {
      companyId,
      deletedAt: null,
      issueDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {})
    },
    select: {
      id: true,
      invoiceNumber: true,
      issueDate: true,
      dueDate: true,
      status: true,
      totalAmount: true,
      amountPaid: true,
      customer: { select: { id: true, name: true } }
    },
    orderBy: { issueDate: "desc" }
  });
}

export async function invoiceRegisterSummary(
  companyId: string,
  range: ResolvedDateRange,
  customerId?: string,
  status?: InvoiceStatus
) {
  const result = await prisma.invoice.aggregate({
    where: {
      companyId,
      deletedAt: null,
      issueDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {})
    },
    _sum: { totalAmount: true, amountPaid: true },
    _count: true
  });

  return {
    invoiceCount: result._count,
    totalAmount: Number(result._sum.totalAmount ?? 0),
    totalPaid: Number(result._sum.amountPaid ?? 0)
  };
}

// Feeds the Invoice Status chart - count + billed total per status within
// the window.
export async function invoiceStatusBreakdown(companyId: string, range: ResolvedDateRange, customerId?: string) {
  const rows = await prisma.invoice.groupBy({
    by: ["status"],
    where: {
      companyId,
      deletedAt: null,
      issueDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {})
    },
    _sum: { totalAmount: true },
    _count: true
  });

  return rows.map(r => ({ status: r.status, count: r._count, total: Number(r._sum.totalAmount ?? 0) }));
}

// -----------------------------------------------------------------------------
// Expense Report
// -----------------------------------------------------------------------------

export function expenseRows(
  companyId: string,
  range: ResolvedDateRange,
  supplierId?: string,
  expenseCategoryId?: string
) {
  return prisma.expense.findMany({
    where: {
      companyId,
      expenseDate: { gte: range.from, lte: range.to },
      ...(supplierId ? { supplierId } : {}),
      ...(expenseCategoryId ? { expenseCategoryId } : {})
    },
    select: {
      id: true,
      title: true,
      category: true,
      amount: true,
      expenseDate: true,
      paymentMethod: true,
      supplier: { select: { id: true, name: true } }
    },
    orderBy: { expenseDate: "desc" }
  });
}

export async function expenseReportSummary(
  companyId: string,
  range: ResolvedDateRange,
  supplierId?: string,
  expenseCategoryId?: string
) {
  const result = await prisma.expense.aggregate({
    where: {
      companyId,
      expenseDate: { gte: range.from, lte: range.to },
      ...(supplierId ? { supplierId } : {}),
      ...(expenseCategoryId ? { expenseCategoryId } : {})
    },
    _sum: { amount: true },
    _count: true
  });

  return { total: Number(result._sum.amount ?? 0), count: result._count };
}

export async function expenseReportByCategory(
  companyId: string,
  range: ResolvedDateRange,
  supplierId?: string,
  expenseCategoryId?: string
) {
  const rows = await prisma.expense.groupBy({
    by: ["category"],
    where: {
      companyId,
      expenseDate: { gte: range.from, lte: range.to },
      ...(supplierId ? { supplierId } : {}),
      ...(expenseCategoryId ? { expenseCategoryId } : {})
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } }
  });

  return rows.map(r => ({ category: r.category, total: Number(r._sum.amount ?? 0) }));
}

// -----------------------------------------------------------------------------
// Income Report
// -----------------------------------------------------------------------------

export function incomeRows(
  companyId: string,
  range: ResolvedDateRange,
  customerId?: string,
  incomeCategoryId?: string
) {
  return prisma.income.findMany({
    where: {
      companyId,
      incomeDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {}),
      ...(incomeCategoryId ? { incomeCategoryId } : {})
    },
    select: {
      id: true,
      title: true,
      category: true,
      amount: true,
      incomeDate: true,
      method: true,
      customer: { select: { id: true, name: true } }
    },
    orderBy: { incomeDate: "desc" }
  });
}

export async function incomeReportSummary(
  companyId: string,
  range: ResolvedDateRange,
  customerId?: string,
  incomeCategoryId?: string
) {
  const result = await prisma.income.aggregate({
    where: {
      companyId,
      incomeDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {}),
      ...(incomeCategoryId ? { incomeCategoryId } : {})
    },
    _sum: { amount: true },
    _count: true
  });

  return { total: Number(result._sum.amount ?? 0), count: result._count };
}

export async function incomeReportByCategory(
  companyId: string,
  range: ResolvedDateRange,
  customerId?: string,
  incomeCategoryId?: string
) {
  const rows = await prisma.income.groupBy({
    by: ["category"],
    where: {
      companyId,
      incomeDate: { gte: range.from, lte: range.to },
      ...(customerId ? { customerId } : {}),
      ...(incomeCategoryId ? { incomeCategoryId } : {})
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } }
  });

  return rows.map(r => ({ category: r.category, total: Number(r._sum.amount ?? 0) }));
}

// -----------------------------------------------------------------------------
// Payment Report
// -----------------------------------------------------------------------------

export function paymentReportRows(
  companyId: string,
  range: ResolvedDateRange,
  type?: PaymentType,
  status?: PaymentStatus,
  customerId?: string,
  supplierId?: string
) {
  return prisma.payment.findMany({
    where: {
      companyId,
      paymentDate: { gte: range.from, lte: range.to },
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(supplierId ? { supplierId } : {})
    },
    select: {
      id: true,
      amount: true,
      method: true,
      type: true,
      status: true,
      paymentDate: true,
      reference: true,
      customer: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } }
    },
    orderBy: { paymentDate: "desc" }
  });
}

export async function paymentReportSummary(
  companyId: string,
  range: ResolvedDateRange,
  customerId?: string,
  supplierId?: string
) {
  const baseWhere = {
    companyId,
    paymentDate: { gte: range.from, lte: range.to },
    status: "COMPLETED" as const,
    ...(customerId ? { customerId } : {}),
    ...(supplierId ? { supplierId } : {})
  };

  const [received, paid] = await Promise.all([
    prisma.payment.aggregate({ where: { ...baseWhere, type: "RECEIVED" }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { ...baseWhere, type: "PAID" }, _sum: { amount: true }, _count: true })
  ]);

  return {
    totalReceived: Number(received._sum.amount ?? 0),
    receivedCount: received._count,
    totalPaid: Number(paid._sum.amount ?? 0),
    paidCount: paid._count
  };
}

// -----------------------------------------------------------------------------
// Tax Report
// -----------------------------------------------------------------------------

// Tax collected per invoice - Invoice.taxAmount is the only tax figure the
// schema tracks today (there's no separate Tax/TaxRate entity yet), so this
// report is a windowed view over that field rather than a new aggregation
// concept. CANCELLED invoices are excluded, same reasoning as Sales Report:
// tax on a cancelled invoice was never actually collected.
export function taxInvoiceRows(companyId: string, range: ResolvedDateRange) {
  return prisma.invoice.findMany({
    where: { companyId, deletedAt: null, status: { not: "CANCELLED" }, issueDate: { gte: range.from, lte: range.to } },
    select: {
      id: true,
      invoiceNumber: true,
      issueDate: true,
      status: true,
      subtotal: true,
      taxAmount: true,
      totalAmount: true,
      customer: { select: { id: true, name: true } }
    },
    orderBy: { issueDate: "desc" }
  });
}

export async function taxSummary(companyId: string, range: ResolvedDateRange) {
  const result = await prisma.invoice.aggregate({
    where: { companyId, deletedAt: null, status: { not: "CANCELLED" }, issueDate: { gte: range.from, lte: range.to } },
    _sum: { subtotal: true, taxAmount: true, totalAmount: true },
    _count: true
  });

  return {
    invoiceCount: result._count,
    totalTaxableAmount: Number(result._sum.subtotal ?? 0),
    totalTaxCollected: Number(result._sum.taxAmount ?? 0),
    totalBilled: Number(result._sum.totalAmount ?? 0)
  };
}

// -----------------------------------------------------------------------------
// Monthly Summary Report
// -----------------------------------------------------------------------------

// Revenue (RECEIVED+COMPLETED payments + other income), expenses, and
// invoiced sales, each bucketed by calendar month within [range.from,
// range.to] - same three series dashboard.repository.ts's monthlyRevenue/
// monthlyExpenses/monthlySales track, but bounded on both ends (those are
// "since X, trailing to now") since a report needs a closed window rather
// than an always-trailing one.
export function monthlyRevenueSeries(companyId: string, range: ResolvedDateRange) {
  return prisma.$queryRaw<{ month: string; total: string }[]>`
    SELECT month, SUM(total) AS total FROM (
      SELECT DATE_FORMAT(paymentDate, ${monthlyFormatLiteral()}) AS month, SUM(amount) AS total
      FROM payments
      WHERE companyId = ${companyId} AND type = 'RECEIVED' AND status = 'COMPLETED'
        AND paymentDate >= ${range.from} AND paymentDate <= ${range.to}
      GROUP BY DATE_FORMAT(paymentDate, ${monthlyFormatLiteral()})
      UNION ALL
      SELECT DATE_FORMAT(incomeDate, ${monthlyFormatLiteral()}) AS month, SUM(amount) AS total
      FROM incomes
      WHERE companyId = ${companyId} AND incomeDate >= ${range.from} AND incomeDate <= ${range.to}
      GROUP BY DATE_FORMAT(incomeDate, ${monthlyFormatLiteral()})
    ) combined
    GROUP BY month
    ORDER BY month ASC
  `;
}

export function monthlyExpenseSeries(companyId: string, range: ResolvedDateRange) {
  return prisma.$queryRaw<{ month: string; total: string }[]>`
    SELECT DATE_FORMAT(expenseDate, ${monthlyFormatLiteral()}) AS month, SUM(amount) AS total
    FROM expenses
    WHERE companyId = ${companyId} AND expenseDate >= ${range.from} AND expenseDate <= ${range.to}
    GROUP BY DATE_FORMAT(expenseDate, ${monthlyFormatLiteral()})
    ORDER BY month ASC
  `;
}

export function monthlySalesSeries(companyId: string, range: ResolvedDateRange) {
  return prisma.$queryRaw<{ month: string; total: string }[]>`
    SELECT DATE_FORMAT(issueDate, ${monthlyFormatLiteral()}) AS month, SUM(totalAmount) AS total
    FROM invoices
    WHERE companyId = ${companyId} AND issueDate >= ${range.from} AND issueDate <= ${range.to}
      AND status != 'CANCELLED' AND deletedAt IS NULL
    GROUP BY DATE_FORMAT(issueDate, ${monthlyFormatLiteral()})
    ORDER BY month ASC
  `;
}

export function monthlyInvoiceCountSeries(companyId: string, range: ResolvedDateRange) {
  return prisma.$queryRaw<{ month: string; total: string }[]>`
    SELECT DATE_FORMAT(issueDate, ${monthlyFormatLiteral()}) AS month, COUNT(*) AS total
    FROM invoices
    WHERE companyId = ${companyId} AND issueDate >= ${range.from} AND issueDate <= ${range.to}
      AND status != 'CANCELLED' AND deletedAt IS NULL
    GROUP BY DATE_FORMAT(issueDate, ${monthlyFormatLiteral()})
    ORDER BY month ASC
  `;
}
