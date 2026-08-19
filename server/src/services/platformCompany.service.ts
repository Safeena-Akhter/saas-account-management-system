import {
  findByIdForAdmin,
  findManyForAdmin,
  getCompanyStats,
  setCompanyActive,
  softDeleteCompany,
  updateCompanyById
} from "../repositories/platformCompany.repository";
import { findManyByCompany } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import type { UpdateCompanyProfileInput } from "../validators/company.validator";
import type { ListPlatformCompaniesQuery, ListPlatformCompanyUsersQuery } from "../validators/platformCompany.validator";

// Flattens the `users` array (which only ever holds the one owner, per
// OWNER_SELECT's `take: 1` in platformCompany.repository.ts) into a single
// `owner` field, and drops the array - the frontend company list/detail
// screens want "the owner", not a one-item array to unwrap themselves in
// every consumer.
function withOwner<T extends { users: { id: string; name: string; email: string; isActive: boolean }[] }>(
  company: T
) {
  const { users, ...rest } = company;

  return { ...rest, owner: users[0] ?? null };
}

export async function listCompanies(query: ListPlatformCompaniesQuery) {
  const { companies, total } = await findManyForAdmin(query);

  return {
    companies: companies.map(withOwner),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize))
    }
  };
}

// Derives a plain-English renewal status from the existing
// status/billingCycle/endDate fields rather than a stored flag - there's
// no "auto-renew" concept anywhere else in this app's subscription design
// (see subscription.service.ts), so this stays purely presentational, not
// a new billing model.
const EXPIRING_SOON_DAYS = 7;

function renewalStatus(subscription: { status: string; endDate: Date } | null) {
  if (!subscription) {
    return "No active subscription";
  }

  if (subscription.status === "TRIAL") {
    return "Trial";
  }

  if (subscription.status !== "ACTIVE") {
    return subscription.status === "EXPIRED" ? "Expired" : "Cancelled";
  }

  const daysRemaining = Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return "Expired";
  }

  if (daysRemaining <= EXPIRING_SOON_DAYS) {
    return `Expiring in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
  }

  return "Active";
}

export async function getCompanyDetails(companyId: string) {
  const company = await findByIdForAdmin(companyId);

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const [stats] = await Promise.all([getCompanyStats(companyId)]);
  const subscription = company.subscriptions[0] ?? null;
  const owner = company.users[0] ?? null;

  return {
    company: {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      contactEmail: company.contactEmail,
      phone: company.phone,
      address: company.address,
      taxNumber: company.taxNumber,
      currency: company.currency,
      isActive: company.isActive,
      isDeleted: company.deletedAt !== null,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    },
    owner,
    subscription: subscription
      ? {
          planId: subscription.plan.id,
          planName: subscription.plan.name,
          billingCycle: subscription.billingCycle,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          renewalStatus: renewalStatus(subscription)
        }
      : null,
    stats
  };
}

export async function listCompanyUsers(companyId: string, query: ListPlatformCompanyUsersQuery) {
  const company = await findByIdForAdmin(companyId);

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const { search, role, status, page, pageSize } = query;

  const { users, total } = await findManyByCompany({
    companyId,
    search,
    role,
    isActive: status === "all" ? undefined : status === "active",
    page,
    pageSize
  });

  return {
    users,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  };
}

export async function updateCompany(companyId: string, input: UpdateCompanyProfileInput) {
  const result = await updateCompanyById(companyId, input);

  if (result.count === 0) {
    throw new AppError("Company not found", 404);
  }

  return getCompanyDetails(companyId);
}

async function assertExists(companyId: string) {
  const company = await findByIdForAdmin(companyId);

  if (!company || company.deletedAt) {
    throw new AppError("Company not found", 404);
  }
}

export async function suspendCompany(companyId: string) {
  await assertExists(companyId);
  await setCompanyActive(companyId, false);

  return getCompanyDetails(companyId);
}

export async function activateCompany(companyId: string) {
  await assertExists(companyId);
  await setCompanyActive(companyId, true);

  return getCompanyDetails(companyId);
}

export async function deleteCompany(companyId: string) {
  await assertExists(companyId);

  const result = await softDeleteCompany(companyId);

  if (result.count === 0) {
    throw new AppError("Company not found", 404);
  }
}
