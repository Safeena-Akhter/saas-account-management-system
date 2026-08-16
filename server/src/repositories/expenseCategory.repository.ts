import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";
import type { CreateExpenseCategoryInput, UpdateExpenseCategoryInput } from "../validators/expenseCategory.validator";

type ListParams = {
  companyId: string;
  search?: string;
  isActive?: boolean;
  sortBy: "name" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

// _count.expenses mirrors category.repository.ts's _count.products - lets
// the Expense Categories table show an "Expenses" column without a second
// round trip per row.
const withExpenseCount = { _count: { select: { expenses: true } } } as const;

export async function findManyByCompany({ companyId, search, isActive, sortBy, sortOrder, page, pageSize }: ListParams) {
  const where: Prisma.ExpenseCategoryWhereInput = {
    companyId,
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] } : {})
  };

  const [categories, total] = await Promise.all([
    prisma.expenseCategory.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: withExpenseCount
    }),
    prisma.expenseCategory.count({ where })
  ]);

  return { categories, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.expenseCategory.findFirst({ where: { id, companyId } });
}

export function findByIdAndCompanyWithExpenseCount(id: string, companyId: string) {
  return prisma.expenseCategory.findFirst({ where: { id, companyId }, include: withExpenseCount });
}

export function findByNameAndCompany(name: string, companyId: string) {
  return prisma.expenseCategory.findFirst({ where: { name, companyId } });
}

export function countExpensesInCategory(expenseCategoryId: string, companyId: string) {
  return prisma.expense.count({ where: { expenseCategoryId, companyId } });
}

export function createExpenseCategory(companyId: string, data: CreateExpenseCategoryInput) {
  return prisma.expenseCategory.create({ data: { ...data, companyId } });
}

export function updateExpenseCategory(id: string, companyId: string, data: UpdateExpenseCategoryInput) {
  return prisma.expenseCategory.updateMany({ where: { id, companyId }, data });
}

export function deleteExpenseCategory(id: string, companyId: string) {
  return prisma.expenseCategory.deleteMany({ where: { id, companyId } });
}
