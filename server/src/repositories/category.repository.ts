import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";
import type { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator";

type ListParams = {
  companyId: string;
  search?: string;
  isActive?: boolean;
  sortBy: "name" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

// _count.products is included on every list row (cheap - a single grouped
// count alongside the main query, not an N+1) so the Categories table can
// show a Products column without a second round trip per row.
const withProductCount = { _count: { select: { products: true } } } as const;

// Mirrors customer.repository.ts's findManyByCompany: same
// where-then-Promise.all(findMany, count) shape, so list endpoints across
// the app stay consistent.
export async function findManyByCompany({
  companyId,
  search,
  isActive,
  sortBy,
  sortOrder,
  page,
  pageSize
}: ListParams) {
  const where: Prisma.CategoryWhereInput = {
    companyId,
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    // MySQL's default collation is case-insensitive already, so plain
    // `contains` is enough here - unlike Postgres, MySQL doesn't accept (or
    // need) Prisma's `mode: "insensitive"` option. Same as
    // customer.repository.ts.
    ...(search
      ? {
          OR: [{ name: { contains: search } }, { description: { contains: search } }]
        }
      : {})
  };

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: withProductCount
    }),
    prisma.category.count({ where })
  ]);

  return { categories, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.category.findFirst({ where: { id, companyId } });
}

// Powers the Category Details view - same shape as the list rows (category
// fields + a live products count) but for exactly one category.
export function findByIdAndCompanyWithProductCount(id: string, companyId: string) {
  return prisma.category.findFirst({ where: { id, companyId }, include: withProductCount });
}

export function findByNameAndCompany(name: string, companyId: string) {
  return prisma.category.findFirst({ where: { name, companyId } });
}

export function countProductsInCategory(categoryId: string, companyId: string) {
  return prisma.product.count({ where: { categoryId, companyId } });
}

export function createCategory(companyId: string, data: CreateCategoryInput) {
  return prisma.category.create({
    data: { ...data, companyId }
  });
}

// updateMany (not update) so the compound where (id + companyId) makes a
// cross-tenant update structurally impossible - same pattern used in
// user.repository.ts.
export function updateCategory(id: string, companyId: string, data: UpdateCategoryInput) {
  return prisma.category.updateMany({
    where: { id, companyId },
    data
  });
}

export function deleteCategory(id: string, companyId: string) {
  return prisma.category.deleteMany({ where: { id, companyId } });
}
