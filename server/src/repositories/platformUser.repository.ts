import type { Prisma } from "@prisma/client";

import { prisma } from "../config/db";
import type { ListPlatformUsersQuery } from "../validators/platformUser.validator";

// Never surfaced in the platform user list/detail - SUPER_ADMIN accounts
// are platform operators, not tenant data, and have companyId = null so
// they'd otherwise show up as a company-less row with no useful company
// column. Mirrors platformCompany.repository.ts's `notDeleted` pattern:
// one constant, reused by every query in this file, so the exclusion can
// never be forgotten on a new query.
const notSuperAdmin = { role: { not: "SUPER_ADMIN" as const } };

const PLATFORM_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  emailVerifiedAt: true,
  company: {
    select: { id: true, name: true, isActive: true }
  }
} satisfies Prisma.UserSelect;

function buildWhere(query: Pick<ListPlatformUsersQuery, "search" | "companyId" | "role" | "status">) {
  const { search, companyId, role, status } = query;

  return {
    ...notSuperAdmin,
    ...(companyId ? { companyId } : {}),
    ...(role ? { role } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
    // Plain `contains` (no `mode: "insensitive"`) - MySQL's default
    // collation is already case-insensitive, same reasoning as
    // user.repository.ts's findManyByCompany and platformCompany.repository.ts's
    // buildWhere.
    ...(search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }]
        }
      : {})
  };
}

export async function findManyForAdmin(query: ListPlatformUsersQuery) {
  const where = buildWhere(query);
  const { page, pageSize } = query;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: PLATFORM_USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.user.count({ where })
  ]);

  return { users, total };
}

export function findByIdForAdmin(id: string) {
  return prisma.user.findFirst({
    where: { id, ...notSuperAdmin },
    select: PLATFORM_USER_SELECT
  });
}

export function setUserActive(id: string, isActive: boolean) {
  return prisma.user.updateMany({ where: { id, ...notSuperAdmin }, data: { isActive } });
}
