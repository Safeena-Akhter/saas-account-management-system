import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";
import type { CreateExpenseInput, UpdateExpenseInput } from "../validators/expense.validator";

const includeDefault = {
  supplier: { select: { id: true, name: true } },
  expenseCategory: { select: { id: true, name: true } }
};

export type ListExpensesOptions = {
  search?: string;
  supplierId?: string;
  expenseCategoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "expenseDate" | "amount" | "title" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

function buildWhere(companyId: string, options: ListExpensesOptions): Prisma.ExpenseWhereInput {
  const { search, supplierId, expenseCategoryId, dateFrom, dateTo } = options;

  return {
    companyId,
    ...(supplierId ? { supplierId } : {}),
    ...(expenseCategoryId ? { expenseCategoryId } : {}),
    ...(dateFrom || dateTo
      ? { expenseDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
    ...(search
      ? {
          OR: [{ title: { contains: search } }, { category: { contains: search } }, { notes: { contains: search } }]
        }
      : {})
  };
}

export async function findManyByCompany(companyId: string, options: ListExpensesOptions = {}) {
  const { sortBy = "expenseDate", sortOrder = "desc", page = 1, pageSize = 200 } = options;
  const where = buildWhere(companyId, options);

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: includeDefault,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.expense.count({ where })
  ]);

  return { expenses, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.expense.findFirst({ where: { id, companyId }, include: includeDefault });
}

export function createExpense(companyId: string, createdByUserId: string | null, data: CreateExpenseInput) {
  const { supplierId, expenseCategoryId, ...rest } = data;

  return prisma.expense.create({
    data: {
      ...rest,
      company: { connect: { id: companyId } },
      ...(supplierId ? { supplier: { connect: { id: supplierId } } } : {}),
      ...(expenseCategoryId ? { expenseCategory: { connect: { id: expenseCategoryId } } } : {}),
      ...(createdByUserId ? { createdBy: { connect: { id: createdByUserId } } } : {})
    },
    include: includeDefault
  });
}

export function updateExpense(id: string, companyId: string, data: UpdateExpenseInput) {
  const { supplierId, expenseCategoryId, ...rest } = data;

  return prisma.expense.updateMany({
    where: { id, companyId },
    data: {
      ...rest,
      ...(supplierId !== undefined ? { supplierId } : {}),
      ...(expenseCategoryId !== undefined ? { expenseCategoryId } : {})
    }
  });
}

export function deleteExpense(id: string, companyId: string) {
  return prisma.expense.deleteMany({ where: { id, companyId } });
}

// Sets the Cloudinary secure_url returned by expense.service.ts's
// uploadExpenseReceipt - same "separate single-purpose update" shape as
// company.repository.ts's updateCompanyLogo.
export function updateExpenseReceipt(id: string, companyId: string, receiptUrl: string) {
  return prisma.expense.updateMany({ where: { id, companyId }, data: { receiptUrl } });
}

export function sumForCompany(companyId: string, where: Prisma.ExpenseWhereInput = {}) {
  return prisma.expense.aggregate({ where: { companyId, ...where }, _sum: { amount: true } });
}

export function dailyTotals(companyId: string, since: Date) {
  return prisma.$queryRaw<{ day: Date; total: string }[]>`
    SELECT DATE(expenseDate) AS day, SUM(amount) AS total
    FROM expenses
    WHERE companyId = ${companyId} AND expenseDate >= ${since}
    GROUP BY DATE(expenseDate)
    ORDER BY day ASC
  `;
}
