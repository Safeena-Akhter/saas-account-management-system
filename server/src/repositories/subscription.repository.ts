import { prisma } from "../config/db";
import type { AssignSubscriptionInput } from "../validators/subscription.validator";

const includeDefault = {
  company: { select: { id: true, name: true } },
  plan: true
};

export function findAllSubscriptions() {
  return prisma.companySubscription.findMany({
    include: includeDefault,
    orderBy: { createdAt: "desc" }
  });
}

export function findActiveByCompany(companyId: string) {
  return prisma.companySubscription.findFirst({
    where: { companyId, status: "ACTIVE" },
    include: includeDefault,
    orderBy: { createdAt: "desc" }
  });
}

export function createSubscription(data: AssignSubscriptionInput) {
  const { companyId, planId, ...rest } = data;

  return prisma.companySubscription.create({
    data: {
      ...rest,
      company: { connect: { id: companyId } },
      plan: { connect: { id: planId } }
    },
    include: includeDefault
  });
}

export function updateStatus(id: string, status: "ACTIVE" | "EXPIRED" | "CANCELLED") {
  return prisma.companySubscription.updateMany({ where: { id }, data: { status } });
}

// Business Owner's "Subscription History" screen - every subscription
// (active, expired, cancelled) the company has ever had, newest first.
// Unlike findAllSubscriptions() above (every company, Super Admin only),
// this is scoped to one companyId.
export function findHistoryByCompany(companyId: string) {
  return prisma.companySubscription.findMany({
    where: { companyId },
    include: includeDefault,
    orderBy: { createdAt: "desc" }
  });
}

// Powers the expiry cron in index.ts: every ACTIVE subscription whose
// endDate has already passed gets flipped to EXPIRED in one bulk update,
// rather than the app relying on a read-time check every time a
// subscription is fetched (which would leave the `status` column lying
// about companies nobody happened to look up recently).
export function expireOverdue() {
  return prisma.companySubscription.updateMany({
    where: { status: "ACTIVE", endDate: { lt: new Date() } },
    data: { status: "EXPIRED" }
  });
}

// The other half of the expiry cron: ACTIVE subscriptions expiring within
// the next `withinDays` days, so a "Renew before it expires" notification
// can go out ahead of time instead of only after the fact.
export function findExpiringWithin(withinDays: number) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  return prisma.companySubscription.findMany({
    where: { status: "ACTIVE", endDate: { gte: now, lte: cutoff } },
    select: { id: true, companyId: true, endDate: true }
  });
}

export function countByStatus(status: "ACTIVE" | "EXPIRED" | "CANCELLED") {
  return prisma.companySubscription.count({ where: { status } });
}

// Simple MRR-style platform revenue: sum of the plan price for every
// currently ACTIVE subscription. A real invoicing/billing-run history for
// the platform itself is a separate, larger feature - this is the
// straightforward number "Active Plans x their price" gives today.
export function activeRevenue() {
  return prisma.companySubscription.findMany({
    where: { status: "ACTIVE" },
    include: { plan: { select: { price: true } } }
  });
}
