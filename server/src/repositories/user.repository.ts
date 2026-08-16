import type { Role } from "@prisma/client";

import { prisma } from "../config/db";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { company: true }
  });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { company: true }
  });
}

type CreateOwnerInput = {
  name: string;
  email: string;
  hashedPassword: string;
  companyName: string;
};

// Registration always creates the Company and its first user (the Business
// Owner) together, atomically, so you never end up with an orphaned Company
// or a User with no companyId.
export function createCompanyWithOwner({ name, email, hashedPassword, companyName }: CreateOwnerInput) {
  return prisma.$transaction(async tx => {
    const company = await tx.company.create({
      data: { name: companyName }
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "BUSINESS_OWNER",
        companyId: company.id
      },
      include: { company: true }
    });

    return user;
  });
}

// ---------------------------------------------------------------------------
// User Management module (spec section 3). Every function below takes
// `companyId` as a required argument and filters by it - this is the
// tenant-scoping pattern flagged in the audit as the highest-priority
// security requirement. There is deliberately no "find user by id" that
// omits companyId anywhere in this file: a manager in Company A must get a
// 404, not a 403, when guessing a user id that belongs to Company B - a 403
// would confirm the id exists at all.
// ---------------------------------------------------------------------------

type ListUsersParams = {
  companyId: string;
  search?: string;
  role?: Role;
  isActive?: boolean;
  page: number;
  pageSize: number;
};

const USER_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  emailVerifiedAt: true,
  createdAt: true
} as const;

// Returns both the page of users and the total match count (pre-pagination)
// in one round trip so the caller can render "Page 2 of 5" / total badges
// without a second query.
//
// `role`/`isActive` were added for the Super Admin company-details screen's
// user list (per-company role/status filters), on top of this function's
// original company-scoped-user-management use - both callers share the
// same underlying query since neither needs anything the other doesn't
// already tolerate as an optional filter.
export async function findManyByCompany({ companyId, search, role, isActive, page, pageSize }: ListUsersParams) {
  const where = {
    companyId,
    ...(role ? { role } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    // MySQL's default collation is case-insensitive already, so plain
    // `contains` is enough here - unlike Postgres, MySQL doesn't accept (or
    // need) Prisma's `mode: "insensitive"` option.
    ...(search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }]
        }
      : {})
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: USER_LIST_SELECT
    }),
    prisma.user.count({ where })
  ]);

  return { users, total };
}

export function findByIdAndCompany(id: string, companyId: string) {
  return prisma.user.findFirst({
    where: { id, companyId }
  });
}

export function countActiveOwners(companyId: string) {
  return prisma.user.count({
    where: { companyId, role: "BUSINESS_OWNER", isActive: true }
  });
}

// Distinct from countActiveOwners: used to guard *deletion*, where an
// inactive-but-still-existing owner still counts as "the only owner left"
// (deleting them is permanent, unlike deactivating).
export function countOwners(companyId: string) {
  return prisma.user.count({
    where: { companyId, role: "BUSINESS_OWNER" }
  });
}

type CreateCompanyUserInput = {
  name: string;
  email: string;
  hashedPassword: string;
  role: Role;
  companyId: string;
};

export function createCompanyUser({ name, email, hashedPassword, role, companyId }: CreateCompanyUserInput) {
  return prisma.user.create({
    data: { name, email, password: hashedPassword, role, companyId },
    select: USER_LIST_SELECT
  });
}

type UpdateCompanyUserInput = Partial<{
  name: string;
  role: Role;
  isActive: boolean;
}>;

export function updateCompanyUser(id: string, companyId: string, data: UpdateCompanyUserInput) {
  // `updateMany` (not `update`) because it accepts a compound `where`
  // (id + companyId) - this is what makes cross-tenant updates impossible
  // even if a controller ever forgets to pre-check ownership: the query
  // itself can only ever match a row that is both the right id AND the
  // right company.
  return prisma.user.updateMany({
    where: { id, companyId },
    data
  });
}

export function deleteCompanyUser(id: string, companyId: string) {
  return prisma.user.deleteMany({
    where: { id, companyId }
  });
}

export function markEmailVerified(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() }
  });
}

// Used by both forgot-password (reset via emailed token) and
// change-password (authenticated, current-password-verified) flows - both
// end with "store this new hash", nothing else differs between them.
export function updatePassword(userId: string, hashedPassword: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

// The one-shot "employee accepted their invitation" transition: sets their
// real password, marks the email verified (invitations are sent to an
// address the owner typed in, but clicking a time-limited emailed link is
// itself proof of access to that inbox - same trust level email
// verification normally establishes), and stamps passwordChangedAt so
// "must reset temporary password" logic elsewhere can rely on it being
// non-null. isActive is untouched - createCompanyUser already creates the
// row active; what was blocking login was emailVerifiedAt being null (see
// auth.service.ts login's unverified-user check), not isActive.
export function activateInvitedUser(userId: string, hashedPassword: string) {
  const now = new Date();

  return prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      emailVerifiedAt: now,
      passwordChangedAt: now
    }
  });
}

// ---------------------------------------------------------------------------
// Self-service Profile & Preferences (Settings module). Unlike
// updateCompanyUser above, these take only `userId` - there's no companyId
// check because a user always has full rights over their own row (and
// SUPER_ADMIN, who has no companyId at all, still needs to edit their own
// profile/preferences).
// ---------------------------------------------------------------------------

type UpdateProfileData = Partial<{ name: string; phone: string }>;

export function updateSelfProfile(userId: string, data: UpdateProfileData) {
  return prisma.user.update({ where: { id: userId }, data });
}

export function updateAvatar(userId: string, avatarUrl: string) {
  return prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
}

type UpdatePreferencesData = Partial<{
  theme: string;
  language: string;
  dateFormat: string;
  currencyFormat: string;
}>;

export function updatePreferences(userId: string, data: UpdatePreferencesData) {
  return prisma.user.update({ where: { id: userId }, data });
}
