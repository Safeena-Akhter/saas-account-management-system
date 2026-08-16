import { prisma } from "../config/db";
import type { CreateProductInput, UpdateProductInput } from "../validators/product.validator";

const withCategory = { category: { select: { id: true, name: true } } } as const;

export function findManyByCompany(companyId: string) {
  return prisma.product.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    include: withCategory
  });
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.product.findFirst({ where: { id, companyId }, include: withCategory });
}

export function findBySkuAndCompany(sku: string, companyId: string) {
  return prisma.product.findFirst({ where: { sku, companyId } });
}

export function createProduct(companyId: string, data: CreateProductInput) {
  const { categoryId, ...rest } = data;

  return prisma.product.create({
    data: { ...rest, companyId, categoryId },
    include: withCategory
  });
}

export async function updateProduct(id: string, companyId: string, data: UpdateProductInput) {
  // updateMany (compound where: id + companyId) - same cross-tenant-proof
  // pattern as every other repository in this codebase.
  const result = await prisma.product.updateMany({
    where: { id, companyId },
    data
  });

  return result.count;
}

export function deleteProduct(id: string, companyId: string) {
  return prisma.product.deleteMany({ where: { id, companyId } });
}
