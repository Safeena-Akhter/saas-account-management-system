import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";

const includeDefault = {
  invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
  customer: { select: { id: true, name: true } },
  supplier: { select: { id: true, name: true } }
};

export type ListPaymentsOptions = {
  where?: Prisma.PaymentWhereInput;
  search?: string;
  sortBy?: "paymentDate" | "amount" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

function buildWhere(companyId: string, options: ListPaymentsOptions): Prisma.PaymentWhereInput {
  const { where = {}, search } = options;

  return {
    companyId,
    ...where,
    ...(search
      ? {
          OR: [
            { reference: { contains: search } },
            { notes: { contains: search } },
            { customer: { name: { contains: search } } },
            { supplier: { name: { contains: search } } },
            { invoice: { invoiceNumber: { contains: search } } }
          ]
        }
      : {})
  };
}

export async function findManyByCompany(companyId: string, options: ListPaymentsOptions = {}) {
  const { sortBy = "paymentDate", sortOrder = "desc", page = 1, pageSize = 200 } = options;
  const where = buildWhere(companyId, options);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: includeDefault,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.payment.count({ where })
  ]);

  return { payments, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.payment.findFirst({ where: { id, companyId }, include: includeDefault });
}

export function createPayment(
  companyId: string,
  data: {
    amount: Prisma.Decimal | number;
    method: Prisma.PaymentCreateInput["method"];
    type: Prisma.PaymentCreateInput["type"];
    status: Prisma.PaymentCreateInput["status"];
    paymentDate?: Date;
    reference?: string | null;
    notes?: string | null;
    invoiceId?: string | null;
    customerId?: string | null;
    supplierId?: string | null;
    createdByUserId?: string | null;
  }
) {
  const { invoiceId, customerId, supplierId, createdByUserId, ...rest } = data;

  return prisma.payment.create({
    data: {
      ...rest,
      company: { connect: { id: companyId } },
      ...(invoiceId ? { invoice: { connect: { id: invoiceId } } } : {}),
      ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
      ...(supplierId ? { supplier: { connect: { id: supplierId } } } : {}),
      ...(createdByUserId ? { createdBy: { connect: { id: createdByUserId } } } : {})
    },
    include: includeDefault
  });
}

export function updatePaymentStatus(id: string, companyId: string, status: Prisma.PaymentUpdateInput["status"]) {
  return prisma.payment.updateMany({ where: { id, companyId }, data: { status } });
}

export function sumForCompany(companyId: string, where: Prisma.PaymentWhereInput = {}) {
  return prisma.payment.aggregate({ where: { companyId, ...where }, _sum: { amount: true } });
}

export function countForCompany(companyId: string, where: Prisma.PaymentWhereInput = {}) {
  return prisma.payment.count({ where: { companyId, ...where } });
}

// Money actually paid out to this supplier - the real, live-computed
// number supplier.service.ts's getSupplierDetails now uses for
// outstandingPayable (openingBalance - this), replacing the old
// "just echo openingBalance" placeholder. Only COMPLETED PAID payments
// count; PENDING/FAILED/CANCELLED haven't (or won't) actually move money.
export async function sumPaymentsForSupplier(supplierId: string, companyId: string) {
  const result = await prisma.payment.aggregate({
    where: { supplierId, companyId, type: "PAID", status: "COMPLETED" },
    _sum: { amount: true }
  });

  return Number(result._sum.amount ?? 0);
}

export function findRecentPaymentsForSupplier(supplierId: string, companyId: string, limit = 5) {
  return prisma.payment.findMany({
    where: { supplierId, companyId, type: "PAID" },
    orderBy: { paymentDate: "desc" },
    take: limit
  });
}

// Payments grouped by day, for the last N days - feeds a Revenue Trend
// chart. Only RECEIVED + COMPLETED count as revenue (a PAID supplier
// payment or a PENDING/FAILED row isn't money the company has taken in).
// Raw query since Prisma's groupBy can't truncate a DateTime to a day.
export function dailyTotals(companyId: string, since: Date) {
  return prisma.$queryRaw<{ day: Date; total: string }[]>`
    SELECT DATE(paymentDate) AS day, SUM(amount) AS total
    FROM payments
    WHERE companyId = ${companyId} AND paymentDate >= ${since} AND type = 'RECEIVED' AND status = 'COMPLETED'
    GROUP BY DATE(paymentDate)
    ORDER BY day ASC
  `;
}
