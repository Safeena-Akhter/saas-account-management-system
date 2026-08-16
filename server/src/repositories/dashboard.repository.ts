import { prisma } from "../config/db";

// -----------------------------------------------------------------------------
// Counts - Business Owner / Manager / Employee KPI tiles
// -----------------------------------------------------------------------------

export function countCustomers(companyId: string) {
  return prisma.customer.count({ where: { companyId } });
}

export function countSuppliers(companyId: string) {
  return prisma.supplier.count({ where: { companyId } });
}

export function countProducts(companyId: string) {
  return prisma.product.count({ where: { companyId } });
}

export function countLowStockProducts(companyId: string, threshold = 10) {
  return prisma.product.count({ where: { companyId, stockQuantity: { lte: threshold } } });
}

export function countUsers(companyId: string) {
  return prisma.user.count({ where: { companyId } });
}

// Added alongside the other cross-module counts here so
// services/planLimit.service.ts (Plan.maxCategories enforcement) can reuse
// it the same way it reuses countUsers/countCustomers/countSuppliers/
// countProducts above, rather than duplicating a `prisma.category.count`
// in a second place.
export function countCategories(companyId: string) {
  return prisma.category.count({ where: { companyId } });
}

export function countInvoicesByStatus(companyId: string, statuses: string[]) {
  return prisma.invoice.count({ where: { companyId, deletedAt: null, status: { in: statuses as never } } });
}

// -----------------------------------------------------------------------------
// Sums - revenue / expenses / outstanding balance
// -----------------------------------------------------------------------------

// Revenue = money actually collected from customers (Payment, type
// RECEIVED, status COMPLETED - excludes Supplier Payments, which are money
// OUT, and excludes PENDING/FAILED/CANCELLED payments, which haven't
// cleared) PLUS other income recorded directly (Income - see
// income.repository.ts). Both halves only count completed/recorded
// amounts; nothing here is a forecast.
export async function totalRevenue(companyId: string) {
  const [paymentsResult, incomeResult] = await Promise.all([
    prisma.payment.aggregate({
      where: { companyId, type: "RECEIVED", status: "COMPLETED" },
      _sum: { amount: true }
    }),
    prisma.income.aggregate({ where: { companyId }, _sum: { amount: true } })
  ]);

  return Number(paymentsResult._sum.amount ?? 0) + Number(incomeResult._sum.amount ?? 0);
}

export async function totalExpenses(companyId: string) {
  const result = await prisma.expense.aggregate({ where: { companyId }, _sum: { amount: true } });

  return Number(result._sum.amount ?? 0);
}

export async function outstandingBalance(companyId: string) {
  const result = await prisma.invoice.aggregate({
    where: { companyId, deletedAt: null, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
    _sum: { totalAmount: true, amountPaid: true }
  });

  return Number(result._sum.totalAmount ?? 0) - Number(result._sum.amountPaid ?? 0);
}

// Unpaid invoices awaiting a customer payment. Deliberately NOT redefined
// around Payment.status=PENDING now that that exists - "pending payments"
// on this dashboard has always meant "invoices we're still waiting to be
// paid", and that reading stays intact and correct with the new field
// (a PENDING Payment against one of these invoices doesn't move it out of
// this count until it's COMPLETED, since recomputeAmountPaid only counts
// COMPLETED payments - see invoice.repository.ts).
export async function pendingPaymentsCount(companyId: string) {
  return prisma.invoice.count({ where: { companyId, deletedAt: null, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } } });
}

// Amount currently owed to suppliers, live-computed the same way as
// outstandingBalance's receivables side: opening balances minus every
// completed Supplier Payment made against them. See
// supplier.service.ts#getSupplierDetails for the same calculation scoped
// to a single supplier.
export async function outstandingPayable(companyId: string) {
  const [openingResult, paidResult] = await Promise.all([
    prisma.supplier.aggregate({ where: { companyId }, _sum: { openingBalance: true } }),
    prisma.payment.aggregate({ where: { companyId, type: "PAID", status: "COMPLETED" }, _sum: { amount: true } })
  ]);

  return Number(openingResult._sum.openingBalance ?? 0) - Number(paidResult._sum.amount ?? 0);
}

// -----------------------------------------------------------------------------
// Chart data
// -----------------------------------------------------------------------------

// Revenue (payments collected from customers + other income) and expenses
// grouped by month, for the last N months. Raw SQL because Prisma has no
// native "group by month" aggregation. UNION ALL + an outer SUM merges the
// two revenue sources into one series per month; only RECEIVED+COMPLETED
// payments count (see totalRevenue's comment above for why).
export function monthlyRevenue(companyId: string, since: Date) {
  return prisma.$queryRaw<{ month: string; total: string }[]>`
    SELECT month, SUM(total) AS total FROM (
      SELECT DATE_FORMAT(paymentDate, '%Y-%m') AS month, SUM(amount) AS total
      FROM payments
      WHERE companyId = ${companyId} AND paymentDate >= ${since} AND type = 'RECEIVED' AND status = 'COMPLETED'
      GROUP BY DATE_FORMAT(paymentDate, '%Y-%m')
      UNION ALL
      SELECT DATE_FORMAT(incomeDate, '%Y-%m') AS month, SUM(amount) AS total
      FROM incomes
      WHERE companyId = ${companyId} AND incomeDate >= ${since}
      GROUP BY DATE_FORMAT(incomeDate, '%Y-%m')
    ) combined
    GROUP BY month
    ORDER BY month ASC
  `;
}

export function monthlyExpenses(companyId: string, since: Date) {
  return prisma.$queryRaw<{ month: string; total: string }[]>`
    SELECT DATE_FORMAT(expenseDate, '%Y-%m') AS month, SUM(amount) AS total
    FROM expenses
    WHERE companyId = ${companyId} AND expenseDate >= ${since}
    GROUP BY DATE_FORMAT(expenseDate, '%Y-%m')
    ORDER BY month ASC
  `;
}

// "Monthly Sales" = invoiced totals (not just collected payments) grouped by
// month - distinct from monthlyRevenue, which tracks cash actually received.
export function monthlySales(companyId: string, since: Date) {
  return prisma.$queryRaw<{ month: string; total: string }[]>`
    SELECT DATE_FORMAT(issueDate, '%Y-%m') AS month, SUM(totalAmount) AS total
    FROM invoices
    WHERE companyId = ${companyId} AND issueDate >= ${since} AND status != 'CANCELLED' AND deletedAt IS NULL
    GROUP BY DATE_FORMAT(issueDate, '%Y-%m')
    ORDER BY month ASC
  `;
}

export async function topCustomers(companyId: string, limit = 5) {
  const rows = await prisma.invoice.groupBy({
    by: ["customerId"],
    where: { companyId, deletedAt: null, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: limit
  });

  const customers = await prisma.customer.findMany({
    where: { id: { in: rows.map(r => r.customerId) } },
    select: { id: true, name: true }
  });

  const byId = new Map(customers.map(c => [c.id, c.name]));

  return rows.map(r => ({
    customerId: r.customerId,
    customerName: byId.get(r.customerId) ?? "Unknown",
    total: Number(r._sum.totalAmount ?? 0)
  }));
}

export async function recentActivities(companyId: string, limit = 8) {
  const [invoices, payments, supplierPayments, expenses, incomes, customers] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, invoiceNumber: true, totalAmount: true, createdAt: true, customer: { select: { name: true } } }
    }),
    prisma.payment.findMany({
      where: { companyId, type: "RECEIVED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, amount: true, createdAt: true, customer: { select: { name: true } } }
    }),
    prisma.payment.findMany({
      where: { companyId, type: "PAID" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, amount: true, createdAt: true, supplier: { select: { name: true } } }
    }),
    prisma.expense.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, amount: true, createdAt: true }
    }),
    prisma.income.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, amount: true, createdAt: true }
    }),
    prisma.customer.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, createdAt: true }
    })
  ]);

  const activities = [
    ...invoices.map(i => ({
      id: `invoice-${i.id}`,
      type: "invoice" as const,
      label: `Invoice ${i.invoiceNumber} created for ${i.customer.name}`,
      amount: Number(i.totalAmount),
      createdAt: i.createdAt
    })),
    ...payments.map(p => ({
      id: `payment-${p.id}`,
      type: "payment" as const,
      label: `Payment received${p.customer ? ` from ${p.customer.name}` : ""}`,
      amount: Number(p.amount),
      createdAt: p.createdAt
    })),
    ...supplierPayments.map(p => ({
      id: `supplier-payment-${p.id}`,
      type: "supplier_payment" as const,
      label: `Payment made${p.supplier ? ` to ${p.supplier.name}` : ""}`,
      amount: Number(p.amount),
      createdAt: p.createdAt
    })),
    ...expenses.map(e => ({
      id: `expense-${e.id}`,
      type: "expense" as const,
      label: `Expense recorded: ${e.title}`,
      amount: Number(e.amount),
      createdAt: e.createdAt
    })),
    ...incomes.map(inc => ({
      id: `income-${inc.id}`,
      type: "income" as const,
      label: `Income recorded: ${inc.title}`,
      amount: Number(inc.amount),
      createdAt: inc.createdAt
    })),
    ...customers.map(c => ({
      id: `customer-${c.id}`,
      type: "customer" as const,
      label: `New customer added: ${c.name}`,
      amount: null,
      createdAt: c.createdAt
    }))
  ];

  return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}

// -----------------------------------------------------------------------------
// Platform-level (Super Admin) - deliberately not companyId-scoped, this is
// the one dashboard that spans every tenant on the platform.
// -----------------------------------------------------------------------------

export function countCompanies() {
  return prisma.company.count();
}

export function countSuspendedCompanies() {
  return prisma.company.count({ where: { isActive: false } });
}

export function countPlatformUsers() {
  return prisma.user.count();
}

export function countSubscriptionsByStatus(status: "ACTIVE" | "EXPIRED" | "CANCELLED") {
  return prisma.companySubscription.count({ where: { status } });
}

// Monthly Recurring Revenue (MRR) across every active subscription -
// normalizes each subscription's contribution to a monthly figure
// regardless of which cycle it's actually billed under, so a $790/year
// Premium subscriber and a $79/month Premium subscriber contribute the
// same amount to this total (rather than the old bug, which read a
// `plan.price` field that no longer exists on Plan at all - see
// schema.prisma's Plan model, which replaced it with separate
// monthlyPrice/yearlyPrice and moved billingCycle onto
// CompanySubscription). This is the standard SaaS "MRR" convention, not a
// new billing model - it's just correctly deriving one comparable number
// from the billing-cycle design that already exists.
export async function platformRevenue() {
  const activeSubs = await prisma.companySubscription.findMany({
    where: { status: "ACTIVE" },
    select: {
      billingCycle: true,
      plan: { select: { monthlyPrice: true, yearlyPrice: true } }
    }
  });

  return activeSubs.reduce((sum, sub) => {
    const monthlyEquivalent =
      sub.billingCycle === "YEARLY" ? Number(sub.plan.yearlyPrice) / 12 : Number(sub.plan.monthlyPrice);

    return sum + monthlyEquivalent;
  }, 0);
}
