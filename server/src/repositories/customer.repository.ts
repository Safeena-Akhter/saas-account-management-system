import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";
import type { CreateCustomerInput, UpdateCustomerInput } from "../validators/customer.validator";

type ListParams = {
  companyId: string;
  search?: string;
  isActive?: boolean;
  sortBy: "name" | "email" | "createdAt" | "creditLimit";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

// Mirrors user.repository.ts's findManyByCompany: same
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
  const where: Prisma.CustomerWhereInput = {
    companyId,
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    // MySQL's default collation is case-insensitive already, so plain
    // `contains` is enough here - unlike Postgres, MySQL doesn't accept (or
    // need) Prisma's `mode: "insensitive"` option.
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

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.customer.count({ where })
  ]);

  return { customers, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.customer.findFirst({ where: { id, companyId } });
}

export function createCustomer(companyId: string, data: CreateCustomerInput) {
  return prisma.customer.create({ data: { ...data, companyId } });
}

// updateMany/deleteMany with a compound (id + companyId) where, same
// cross-tenant-proof pattern used by every other repository in this codebase.
export function updateCustomer(id: string, companyId: string, data: UpdateCustomerInput) {
  return prisma.customer.updateMany({ where: { id, companyId }, data });
}

export function deleteCustomer(id: string, companyId: string) {
  return prisma.customer.deleteMany({ where: { id, companyId } });
}

// Dependent-record counts used to guard hard delete (see
// customer.service.ts's deleteCustomer) - same "block delete, offer
// deactivate instead" pattern category.service.ts already uses for
// Category -> Product.
// Deliberately counts ALL invoices for this customer, deleted included -
// the invoices.customerId FK has no onDelete cascade, so a customer with
// even a soft-deleted invoice still can't be hard-deleted at the DB level;
// this guard has to match that reality rather than only "visible" invoices.
export function countInvoicesForCustomer(customerId: string, companyId: string) {
  return prisma.invoice.count({ where: { customerId, companyId } });
}

export function countPaymentsForCustomer(customerId: string, companyId: string) {
  return prisma.payment.count({ where: { customerId, companyId } });
}

// Same status set as invoice.repository.ts's sumOutstanding (company-wide
// version): SENT/PARTIALLY_PAID/OVERDUE are the "money still owed" states -
// DRAFT isn't billed yet, PAID and CANCELLED don't carry a balance.
export function sumOutstandingForCustomer(customerId: string, companyId: string) {
  return prisma.invoice.aggregate({
    where: { customerId, companyId, deletedAt: null, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
    _sum: { totalAmount: true, amountPaid: true }
  });
}

export function findRecentInvoicesForCustomer(customerId: string, companyId: string, limit = 5) {
  return prisma.invoice.findMany({
    where: { customerId, companyId, deletedAt: null },
    orderBy: { issueDate: "desc" },
    take: limit,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      issueDate: true,
      dueDate: true,
      totalAmount: true,
      amountPaid: true
    }
  });
}

export function findRecentPaymentsForCustomer(customerId: string, companyId: string, limit = 5) {
  return prisma.payment.findMany({
    where: { customerId, companyId },
    orderBy: { paymentDate: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      method: true,
      paymentDate: true,
      reference: true,
      invoice: { select: { id: true, invoiceNumber: true } }
    }
  });
}
