// Feature Limits enforcement (per the Subscription Management module spec).
//
// schema.prisma's comment on Plan already documented the intent for this
// file ("Enforced by services/planLimit.service.ts at each corresponding
// create-flow") - it just didn't exist yet. Every create-flow it's wired
// into (user.service, customer.service, supplier.service, product.service,
// category.service, invoice.service) calls `enforceLimit(companyId, ...)`
// as the very first thing, before any other work, so a company at its cap
// gets a clean 403 instead of a partially-created row.
//
// Not enforced here (deliberately, see schema.prisma's comment on those
// fields): maxMonthlyReports, storageLimitMb, uploadLimitMb, apiRequestLimit.
// Enforcing those would need real usage-metering infrastructure that
// doesn't exist yet (a persisted log of report generations, actual
// file-storage-bytes-used tracking, an API rate limiter) - same
// "captured but not yet enforced" posture the schema already documents for
// apiRequestLimit. Building that metering layer is future work, not a
// silent gap: BusinessOwnerUsage (below) still surfaces the configured
// limits for these to the UI so the numbers aren't hidden, just not
// gated on yet.

import { AppError } from "../utils/AppError";
import { findActiveByCompany } from "../repositories/subscription.repository";
import * as dash from "../repositories/dashboard.repository";

// Mirrors invoice.service.ts / dashboard.service.ts's definition of "a live
// invoice" - soft-deleted invoices never count against the plan's cap since
// they're already excluded everywhere else a company's invoice count is
// shown.
const LIVE_INVOICE_STATUSES = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"];

export type LimitedResource = "users" | "customers" | "suppliers" | "products" | "categories" | "invoices";

const RESOURCE_LABELS: Record<LimitedResource, string> = {
  users: "users",
  customers: "customers",
  suppliers: "suppliers",
  products: "products",
  categories: "categories",
  invoices: "invoices"
};

function currentUsage(companyId: string, resource: LimitedResource) {
  switch (resource) {
    case "users":
      return dash.countUsers(companyId);
    case "customers":
      return dash.countCustomers(companyId);
    case "suppliers":
      return dash.countSuppliers(companyId);
    case "products":
      return dash.countProducts(companyId);
    case "categories":
      return dash.countCategories(companyId);
    case "invoices":
      return dash.countInvoicesByStatus(companyId, LIVE_INVOICE_STATUSES);
  }
}

// planId + companyId access uses the already-included `plan` on the active
// CompanySubscription row rather than a second query.
type PlanLimits = Awaited<ReturnType<typeof findActiveByCompany>>;

function limitFor(subscription: NonNullable<PlanLimits>, resource: LimitedResource): number | null {
  switch (resource) {
    case "users":
      return subscription.plan.maxUsers;
    case "customers":
      return subscription.plan.maxCustomers;
    case "suppliers":
      return subscription.plan.maxSuppliers;
    case "products":
      return subscription.plan.maxProducts;
    case "categories":
      return subscription.plan.maxCategories;
    case "invoices":
      return subscription.plan.maxInvoices;
  }
}

// Called first, before any write, by every create-flow listed above.
// Throws (never returns a boolean) so call sites can't accidentally ignore
// a "limit reached" result the way they could a falsy return value.
export async function enforceLimit(companyId: string, resource: LimitedResource) {
  const subscription = await findActiveByCompany(companyId);

  if (!subscription) {
    // Every company should have one (auth.service.ts's register() assigns
    // the Free plan automatically, and a Super Admin assigning a
    // replacement never leaves a gap - see subscription.service.ts's
    // assignSubscription). Getting here means the company's subscription
    // lapsed with nothing replacing it (e.g. EXPIRED and not yet renewed) -
    // fail closed rather than silently allowing unlimited creation.
    throw new AppError(
      "Your company has no active subscription. Renew or choose a plan to continue.",
      403
    );
  }

  const limit = limitFor(subscription, resource);

  if (limit === null) {
    // null = unlimited, per schema.prisma's comment on Plan.
    return;
  }

  const used = await currentUsage(companyId, resource);

  if (used >= limit) {
    throw new AppError(
      `You've reached your plan's limit of ${limit} ${RESOURCE_LABELS[resource]}. Upgrade your plan to add more.`,
      403
    );
  }
}

const ALL_RESOURCES: LimitedResource[] = ["users", "customers", "suppliers", "products", "categories", "invoices"];

// Powers the Business Owner's usage progress bars (subscription.service.ts's
// getMyUsage). Unlike enforceLimit above, this never throws - a company at
// or over its cap should still be able to *see* that, not get an error
// instead of a page.
export async function getUsageSummary(companyId: string) {
  const subscription = await findActiveByCompany(companyId);

  if (!subscription) {
    return null;
  }

  const usageEntries = await Promise.all(
    ALL_RESOURCES.map(async resource => {
      const limit = limitFor(subscription, resource);
      const used = await currentUsage(companyId, resource);

      return [
        resource,
        {
          used,
          limit,
          // Null limit = unlimited, so it can never be "at/near capacity".
          percentUsed: limit === null ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100))
        }
      ] as const;
    })
  );

  return {
    subscription,
    usage: Object.fromEntries(usageEntries) as Record<LimitedResource, { used: number; limit: number | null; percentUsed: number }>,
    // Surfaced but not enforced yet - see this file's top-of-file comment.
    unenforced: {
      maxMonthlyReports: subscription.plan.maxMonthlyReports,
      storageLimitMb: subscription.plan.storageLimitMb,
      uploadLimitMb: subscription.plan.uploadLimitMb,
      apiRequestLimit: subscription.plan.apiRequestLimit
    }
  };
}
