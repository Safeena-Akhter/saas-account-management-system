import type { Prisma } from "@prisma/client";

import { prisma } from "../config/db";
import type { ListPlatformCompaniesQuery } from "../validators/platformCompany.validator";

// Excluded from every query in this file by default - see schema.prisma's
// comment on Company.deletedAt for why a soft-deleted company never
// hard-deletes. A handful of functions below (findByIdForAdmin) still
// accept an already-deleted company so a Super Admin can view its
// read-only details after deletion; the list below never surfaces one.
const notDeleted = { deletedAt: null } as const;

const LIST_SELECT = {
  id: true,
  name: true,
  logoUrl: true,
  contactEmail: true,
  phone: true,
  isActive: true,
  createdAt: true,
  _count: { select: { users: true } },
  subscriptions: {
    where: { status: "ACTIVE" as const },
    take: 1,
    orderBy: { createdAt: "desc" as const },
    select: {
      billingCycle: true,
      status: true,
      endDate: true,
      plan: { select: { id: true, name: true } }
    }
  }
} satisfies Prisma.CompanySelect;

function buildWhere(query: Pick<ListPlatformCompaniesQuery, "search" | "status" | "planId" | "dateFrom" | "dateTo">) {
  const { search, status, planId, dateFrom, dateTo } = query;

  return {
    ...notDeleted,
    ...(status === "active" ? { isActive: true } : status === "suspended" ? { isActive: false } : {}),
    ...(planId ? { subscriptions: { some: { planId, status: "ACTIVE" as const } } } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {})
          }
        }
      : {}),
    ...(search
      ? {
          // See user.repository.ts's findManyByCompany for why plain
          // `contains` (no `mode: "insensitive"`) is correct on MySQL.
          OR: [{ name: { contains: search } }, { contactEmail: { contains: search } }]
        }
      : {})
  };
}

function buildOrderBy(
  sortBy: ListPlatformCompaniesQuery["sortBy"],
  sortOrder: ListPlatformCompaniesQuery["sortOrder"]
): Prisma.CompanyOrderByWithRelationInput {
  if (sortBy === "users") {
    return { users: { _count: sortOrder } };
  }

  if (sortBy === "name") {
    return { name: sortOrder };
  }

  return { createdAt: sortOrder };
}

export async function findManyForAdmin(query: ListPlatformCompaniesQuery) {
  const where = buildWhere(query);
  const { page, pageSize, sortBy, sortOrder } = query;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: LIST_SELECT,
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.company.count({ where })
  ]);

  return { companies, total };
}

// Deliberately does NOT filter out a soft-deleted company - a Super Admin
// following a link to an already-deleted company (e.g. from an activity
// log entry) should still see its read-only details with a "deleted"
// banner, not a 404. Callers that need to block writes on a deleted
// company (setActive, delete itself) check `deletedAt` explicitly - see
// setActive/softDelete below.
export function findByIdForAdmin(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      subscriptions: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { plan: true }
      }
    }
  });
}

export function updateCompanyById(id: string, data: Prisma.CompanyUpdateInput) {
  return prisma.company.updateMany({ where: { id, ...notDeleted }, data });
}

export function setCompanyActive(id: string, isActive: boolean) {
  return prisma.company.updateMany({ where: { id, ...notDeleted }, data: { isActive } });
}

// Soft delete: sets deletedAt (excluding the company from every admin list
// and from login - see auth.service.ts's existing `!user.company.isActive`
// check, which this also now guarantees stays true) rather than issuing a
// DELETE. See schema.prisma's comment on Company.deletedAt for why a real
// DELETE is unsafe here.
export function softDeleteCompany(id: string) {
  return prisma.company.updateMany({
    where: { id, ...notDeleted },
    data: { deletedAt: new Date(), isActive: false }
  });
}

// Statistics section of the company details screen. Reuses
// dashboard.repository.ts's existing per-company count helpers where they
// already exist (customers/suppliers/products/users) rather than
// duplicating them - only invoices/expenses/incomes/payments needed a new
// query here, since no shared helper for those existed yet.
export async function getCompanyStats(companyId: string) {
  const [customers, suppliers, products, users, invoices, expenses, incomes, payments] = await Promise.all([
    prisma.customer.count({ where: { companyId } }),
    prisma.supplier.count({ where: { companyId } }),
    prisma.product.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId } }),
    prisma.invoice.count({ where: { companyId, deletedAt: null } }),
    prisma.expense.count({ where: { companyId } }),
    prisma.income.count({ where: { companyId } }),
    prisma.payment.count({ where: { companyId } })
  ]);

  return { users, customers, suppliers, products, invoices, expenses, incomes, payments };
}
