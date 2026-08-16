import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";
import type { CreateSupplierInput, UpdateSupplierInput } from "../validators/supplier.validator";

type ListParams = {
  companyId: string;
  search?: string;
  isActive?: boolean;
  sortBy: "name" | "email" | "createdAt" | "openingBalance";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

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
  const where: Prisma.SupplierWhereInput = {
    companyId,
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    // MySQL's default collation is case-insensitive already, so plain
    // `contains` is enough here - see customer.repository.ts's identical
    // comment for why Prisma's `mode: "insensitive"` isn't needed/accepted.
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } }
          ]
        }
      : {})
  };

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.supplier.count({ where })
  ]);

  return { suppliers, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.supplier.findFirst({ where: { id, companyId } });
}

export function createSupplier(companyId: string, data: CreateSupplierInput) {
  return prisma.supplier.create({ data: { ...data, companyId } });
}

// updateMany with a compound (id + companyId) where, same cross-tenant-proof
// pattern used by every other repository in this codebase.
export function updateSupplier(id: string, companyId: string, data: UpdateSupplierInput) {
  return prisma.supplier.updateMany({ where: { id, companyId }, data });
}

export function deleteSupplier(id: string, companyId: string) {
  return prisma.supplier.deleteMany({ where: { id, companyId } });
}

// Dependent-record count used to guard hard delete (see
// supplier.service.ts's deleteSupplier) - same "block delete, offer
// deactivate instead" pattern customer.service.ts uses for
// Customer -> Invoice/Payment.
export function countExpensesForSupplier(supplierId: string, companyId: string) {
  return prisma.expense.count({ where: { supplierId, companyId } });
}

// Powers Supplier Details' "Purchase Count"/"Payment Count" stats: each
// Expense row is a single already-paid transaction (amount + paymentMethod
// recorded together), so it doubles as both the purchase and its payment -
// there's no separate open-payable/partial-payment concept in this schema
// the way Invoice/Payment gives Customer one. See
// supplier.service.ts's getSupplierDetails for how this gets used.
export function sumExpensesForSupplier(supplierId: string, companyId: string) {
  return prisma.expense.aggregate({
    where: { supplierId, companyId },
    _sum: { amount: true }
  });
}

export function findRecentExpensesForSupplier(supplierId: string, companyId: string, limit = 5) {
  return prisma.expense.findMany({
    where: { supplierId, companyId },
    orderBy: { expenseDate: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      category: true,
      amount: true,
      expenseDate: true,
      paymentMethod: true
    }
  });
}
