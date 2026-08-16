import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";
import type { CreateIncomeCategoryInput, UpdateIncomeCategoryInput } from "../validators/incomeCategory.validator";

type ListParams = {
  companyId: string;
  search?: string;
  isActive?: boolean;
  sortBy: "name" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

// _count.incomes mirrors category.repository.ts's _count.products - lets
// the Income Categories table show an "Incomes" column without a second
// round trip per row.
const withIncomeCount = { _count: { select: { incomes: true } } } as const;

export async function findManyByCompany({ companyId, search, isActive, sortBy, sortOrder, page, pageSize }: ListParams) {
  const where: Prisma.IncomeCategoryWhereInput = {
    companyId,
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] } : {})
  };

  const [categories, total] = await Promise.all([
    prisma.incomeCategory.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: withIncomeCount
    }),
    prisma.incomeCategory.count({ where })
  ]);

  return { categories, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.incomeCategory.findFirst({ where: { id, companyId } });
}

export function findByIdAndCompanyWithIncomeCount(id: string, companyId: string) {
  return prisma.incomeCategory.findFirst({ where: { id, companyId }, include: withIncomeCount });
}

export function findByNameAndCompany(name: string, companyId: string) {
  return prisma.incomeCategory.findFirst({ where: { name, companyId } });
}

export function countIncomesInCategory(incomeCategoryId: string, companyId: string) {
  return prisma.income.count({ where: { incomeCategoryId, companyId } });
}

export function createIncomeCategory(companyId: string, data: CreateIncomeCategoryInput) {
  return prisma.incomeCategory.create({ data: { ...data, companyId } });
}

export function updateIncomeCategory(id: string, companyId: string, data: UpdateIncomeCategoryInput) {
  return prisma.incomeCategory.updateMany({ where: { id, companyId }, data });
}

export function deleteIncomeCategory(id: string, companyId: string) {
  return prisma.incomeCategory.deleteMany({ where: { id, companyId } });
}
