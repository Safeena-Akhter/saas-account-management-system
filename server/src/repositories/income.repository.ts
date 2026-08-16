import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";
import type { CreateIncomeInput, UpdateIncomeInput } from "../validators/income.validator";

const includeDefault = {
  customer: { select: { id: true, name: true } },
  incomeCategory: { select: { id: true, name: true } }
};

export type ListIncomesOptions = {
  search?: string;
  customerId?: string;
  incomeCategoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "incomeDate" | "amount" | "title" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

function buildWhere(companyId: string, options: ListIncomesOptions): Prisma.IncomeWhereInput {
  const { search, customerId, incomeCategoryId, dateFrom, dateTo } = options;

  return {
    companyId,
    ...(customerId ? { customerId } : {}),
    ...(incomeCategoryId ? { incomeCategoryId } : {}),
    ...(dateFrom || dateTo
      ? { incomeDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
    ...(search
      ? {
          OR: [{ title: { contains: search } }, { category: { contains: search } }, { notes: { contains: search } }]
        }
      : {})
  };
}

export async function findManyByCompany(companyId: string, options: ListIncomesOptions = {}) {
  const { sortBy = "incomeDate", sortOrder = "desc", page = 1, pageSize = 200 } = options;
  const where = buildWhere(companyId, options);

  const [incomes, total] = await Promise.all([
    prisma.income.findMany({
      where,
      include: includeDefault,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.income.count({ where })
  ]);

  return { incomes, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.income.findFirst({ where: { id, companyId }, include: includeDefault });
}

export function createIncome(companyId: string, createdByUserId: string | null, data: CreateIncomeInput) {
  const { customerId, incomeCategoryId, ...rest } = data;

  return prisma.income.create({
    data: {
      ...rest,
      company: { connect: { id: companyId } },
      ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
      ...(incomeCategoryId ? { incomeCategory: { connect: { id: incomeCategoryId } } } : {}),
      ...(createdByUserId ? { createdBy: { connect: { id: createdByUserId } } } : {})
    },
    include: includeDefault
  });
}

export function updateIncome(id: string, companyId: string, data: UpdateIncomeInput) {
  const { customerId, incomeCategoryId, ...rest } = data;

  return prisma.income.updateMany({
    where: { id, companyId },
    data: {
      ...rest,
      ...(customerId !== undefined ? { customerId } : {}),
      ...(incomeCategoryId !== undefined ? { incomeCategoryId } : {})
    }
  });
}

export function deleteIncome(id: string, companyId: string) {
  return prisma.income.deleteMany({ where: { id, companyId } });
}

export function sumForCompany(companyId: string, where: Prisma.IncomeWhereInput = {}) {
  return prisma.income.aggregate({ where: { companyId, ...where }, _sum: { amount: true } });
}

export function dailyTotals(companyId: string, since: Date) {
  return prisma.$queryRaw<{ day: Date; total: string }[]>`
    SELECT DATE(incomeDate) AS day, SUM(amount) AS total
    FROM incomes
    WHERE companyId = ${companyId} AND incomeDate >= ${since}
    GROUP BY DATE(incomeDate)
    ORDER BY day ASC
  `;
}

export function monthlyTotals(companyId: string, since: Date) {
  return prisma.$queryRaw<{ month: string; total: string }[]>`
    SELECT DATE_FORMAT(incomeDate, '%Y-%m') AS month, SUM(amount) AS total
    FROM incomes
    WHERE companyId = ${companyId} AND incomeDate >= ${since}
    GROUP BY DATE_FORMAT(incomeDate, '%Y-%m')
    ORDER BY month ASC
  `;
}
