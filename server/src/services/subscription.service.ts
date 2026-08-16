import {
  createSubscription as createSubscriptionRow,
  expireOverdue,
  findActiveByCompany,
  findAllSubscriptions,
  findExpiringWithin,
  findHistoryByCompany,
  updateStatus as updateStatusRow
} from "../repositories/subscription.repository";
import { findPlanById, findPlanByName } from "../repositories/plan.repository";
import { findCompanyById } from "../repositories/company.repository";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { createForRoles, notifyOrIgnore } from "./notification.service";
import { getUsageSummary } from "./planLimit.service";
import type { AssignSubscriptionInput, ChangeMySubscriptionInput } from "../validators/subscription.validator";
import type { BillingCycle } from "@prisma/client";

export function listSubscriptions() {
  return findAllSubscriptions();
}

export async function assignSubscription(input: AssignSubscriptionInput) {
  const [company, plan] = await Promise.all([findCompanyById(input.companyId), findPlanById(input.planId)]);

  if (!company) {
    throw new AppError("Company not found", 400);
  }

  if (!plan) {
    throw new AppError("Plan not found", 400);
  }

  if (input.endDate <= (input.startDate ?? new Date())) {
    throw new AppError("End date must be after the start date", 422);
  }

  // A company only ever has one live subscription - assigning a new one
  // supersedes whatever was active before, same way changing a plan works
  // in any real billing system.
  await prisma.companySubscription.updateMany({
    where: { companyId: input.companyId, status: "ACTIVE" },
    data: { status: "CANCELLED" }
  });

  return createSubscriptionRow(input);
}

export async function updateSubscriptionStatus(subscriptionId: string, status: "ACTIVE" | "EXPIRED" | "CANCELLED") {
  // Looked up before the update purely to know which company to notify -
  // updateStatusRow itself still does the actual write via `id` alone, same
  // as before.
  const existing = await prisma.companySubscription.findUnique({
    where: { id: subscriptionId },
    select: { companyId: true, status: true }
  });

  const result = await updateStatusRow(subscriptionId, status);

  if (result.count === 0) {
    throw new AppError("Subscription not found", 404);
  }

  if (existing && existing.status !== "EXPIRED" && status === "EXPIRED") {
    void notifyOrIgnore(() =>
      createForRoles(existing.companyId, ["BUSINESS_OWNER"], {
        type: "SUBSCRIPTION_EXPIRY",
        title: "Subscription expired",
        message: "Your company's subscription has expired. Renew to keep full access.",
        link: "/subscription"
      })
    );
  }
}

// -----------------------------------------------------------------------
// Business Owner self-service ("Manage Own Subscription" per the module's
// RBAC section). Everything below is scoped to the caller's own
// companyId - never takes one from the request body/params - the same
// "trust the verified JWT claim, not anything the client sent" pattern
// every other module's company-scoped service functions follow.
// -----------------------------------------------------------------------

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Calendar-accurate ("add 1 month" / "add 1 year", handling month-length
// and leap-year edge cases correctly) rather than a fixed millisecond
// offset - used everywhere an endDate is computed (a fresh subscription,
// a renewal, a plan change).
function addBillingCycle(from: Date, billingCycle: BillingCycle) {
  const result = new Date(from);

  if (billingCycle === "YEARLY") {
    result.setFullYear(result.getFullYear() + 1);
  } else {
    result.setMonth(result.getMonth() + 1);
  }

  return result;
}

// Auto-subscribes a brand-new company to the Free plan right after
// signup - called once, from auth.service.ts's register(). Every company
// should always have exactly one ACTIVE subscription from the moment it
// exists; without this, findActiveByCompany() would return null for every
// new signup until a Super Admin happened to assign one by hand, and
// planLimit.service.ts's enforceLimit() fails closed (blocks all creation)
// when there's no active subscription.
export async function assignFreePlanToNewCompany(companyId: string) {
  const freePlan = await findPlanByName("Free");

  if (!freePlan) {
    // Seed data wasn't run / the Free plan was renamed or deleted. Don't
    // block registration over this - a Super Admin can still assign a plan
    // by hand, and enforceLimit()'s "no active subscription" 403 is a
    // clear enough signal something needs fixing on the platform side.
    return null;
  }

  const startDate = new Date();
  const endDate = addBillingCycle(startDate, "MONTHLY");

  return createSubscriptionRow({
    companyId,
    planId: freePlan.id,
    billingCycle: "MONTHLY",
    startDate,
    endDate
  });
}

// "View Current Plan" + "Expiry Date" + "Remaining Days" - the Business
// Owner's Subscription page header.
export async function getMySubscription(companyId: string) {
  const subscription = await findActiveByCompany(companyId);

  if (!subscription) {
    return null;
  }

  const remainingDays = Math.max(0, Math.ceil((subscription.endDate.getTime() - Date.now()) / ONE_DAY_MS));

  return { ...subscription, remainingDays };
}

// "View Usage" - the progress bars under the plan card.
export function getMyUsage(companyId: string) {
  return getUsageSummary(companyId);
}

// "Subscription History".
export function getMySubscriptionHistory(companyId: string) {
  return findHistoryByCompany(companyId);
}

// "Upgrade Plan" / "Downgrade Plan" - both are the same operation from the
// service's point of view (assign a different plan, effective immediately,
// superseding whatever was active). The UI decides which label to show
// based on whether the chosen plan's price is higher or lower than the
// current one; the API doesn't need to distinguish.
export async function changeMySubscription(companyId: string, input: ChangeMySubscriptionInput) {
  const plan = await findPlanById(input.planId);

  if (!plan || !plan.isActive) {
    throw new AppError("Plan not found", 400);
  }

  const startDate = new Date();
  const endDate = addBillingCycle(startDate, input.billingCycle);

  await prisma.companySubscription.updateMany({
    where: { companyId, status: "ACTIVE" },
    data: { status: "CANCELLED" }
  });

  const subscription = await createSubscriptionRow({
    companyId,
    planId: plan.id,
    billingCycle: input.billingCycle,
    startDate,
    endDate
  });

  return subscription;
}

// "Renew Subscription" - keeps the same plan and billing cycle, just pushes
// endDate forward by one more cycle from today. Works whether the current
// subscription is still ACTIVE (renewing early) or already EXPIRED
// (renewing after a lapse) - either way a fresh ACTIVE row is what should
// exist afterward, matching changeMySubscription's "new row supersedes the
// old one" shape rather than mutating history in place.
export async function renewMySubscription(companyId: string) {
  const current = await prisma.companySubscription.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" }
  });

  if (!current) {
    throw new AppError("No subscription found to renew. Choose a plan first.", 404);
  }

  const startDate = new Date();
  const endDate = addBillingCycle(startDate, current.billingCycle);

  await prisma.companySubscription.updateMany({
    where: { companyId, status: "ACTIVE" },
    data: { status: "CANCELLED" }
  });

  return createSubscriptionRow({
    companyId,
    planId: current.planId,
    billingCycle: current.billingCycle,
    startDate,
    endDate
  });
}

// "Cancel Subscription" - the company keeps read/write access until
// endDate (matches how SaaS billing normally works: cancelling stops
// renewal, it doesn't yank access immediately), it just won't auto-renew
// and no longer shows as the "current" plan for a *new* assignment. Marking
// it CANCELLED now (rather than waiting for endDate) is what stops it from
// being the row `findActiveByCompany` would otherwise keep returning as
// "ACTIVE" after the Business Owner has already said they want out.
export async function cancelMySubscription(companyId: string) {
  const current = await findActiveByCompany(companyId);

  if (!current) {
    throw new AppError("No active subscription to cancel", 404);
  }

  const result = await updateStatusRow(current.id, "CANCELLED");

  if (result.count === 0) {
    throw new AppError("Subscription not found", 404);
  }
}

// -----------------------------------------------------------------------
// Expiry automation - both called on an interval from index.ts (see
// EXPIRY_CHECK_INTERVAL_MS there). Kept as two separate steps (expire
// first, warn second) so a subscription that crossed its endDate in this
// same tick is reflected as EXPIRED before the warning pass runs, instead
// of the two racing against slightly different snapshots of "now".
// -----------------------------------------------------------------------

// Flips every ACTIVE subscription whose endDate has passed to EXPIRED, and
// notifies each affected company's Business Owner(s) - the same
// notification updateSubscriptionStatus above sends when a Super Admin
// does this by hand, so a company sees the same message regardless of
// which path caused the expiry.
export async function runExpiryCheck() {
  const now = new Date();

  const nowExpired = await prisma.companySubscription.findMany({
    where: { status: "ACTIVE", endDate: { lt: now } },
    select: { id: true, companyId: true }
  });

  if (nowExpired.length === 0) {
    return { expired: 0, warned: 0 };
  }

  await expireOverdue();

  await Promise.all(
    nowExpired.map(sub =>
      notifyOrIgnore(() =>
        createForRoles(sub.companyId, ["BUSINESS_OWNER"], {
          type: "SUBSCRIPTION_EXPIRY",
          title: "Subscription expired",
          message: "Your company's subscription has expired. Renew to keep full access.",
          link: "/subscription"
        })
      )
    )
  );

  const warned = await sendExpiryWarnings();

  return { expired: nowExpired.length, warned };
}

// Warns companies whose subscription is *about to* expire (within the next
// 3 days) - separate from the "already expired" notification above so a
// Business Owner has a chance to renew before losing access, not just a
// notice after the fact.
const EXPIRY_WARNING_WINDOW_DAYS = 3;

async function sendExpiryWarnings() {
  const expiringSoon = await findExpiringWithin(EXPIRY_WARNING_WINDOW_DAYS);

  await Promise.all(
    expiringSoon.map(sub => {
      const daysLeft = Math.max(1, Math.ceil((sub.endDate.getTime() - Date.now()) / ONE_DAY_MS));

      return notifyOrIgnore(() =>
        createForRoles(sub.companyId, ["BUSINESS_OWNER"], {
          type: "SUBSCRIPTION_EXPIRY",
          title: "Subscription expiring soon",
          message: `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew to avoid interruption.`,
          link: "/subscription"
        })
      );
    })
  );

  return expiringSoon.length;
}
