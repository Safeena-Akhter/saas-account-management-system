import { prisma } from "../config/db";
import type { AssignSubscriptionInput } from "../validators/subscription.validator";

const includeDefault = {
  company: { select: { id: true, name: true } },
  plan: true
};

export function findAllSubscriptions(status?: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED") {
  return prisma.companySubscription.findMany({
    where: status ? { status } : undefined,
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

export function updateStatus(id: string, status: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED") {
  return prisma.companySubscription.updateMany({ where: { id }, data: { status } });
}

export function findHistoryByCompany(companyId: string) {
  return prisma.companySubscription.findMany({
    where: { companyId },
    include: includeDefault,
    orderBy: { createdAt: "desc" }
  });
}

export function expireOverdue() {
  return prisma.companySubscription.updateMany({
    where: { status: "ACTIVE", endDate: { lt: new Date() } },
    data: { status: "EXPIRED" }
  });
}

export function findExpiringWithin(withinDays: number) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  return prisma.companySubscription.findMany({
    where: { status: "ACTIVE", endDate: { gte: now, lte: cutoff } },
    select: { id: true, companyId: true, endDate: true }
  });
}

export function countByStatus(status: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED") {
  return prisma.companySubscription.count({ where: { status } });
}

export async function activeRevenue() {
  const subscriptions = await prisma.companySubscription.findMany({
    where: { status: "ACTIVE" },
    include: {
      plan: {
        select: {
          monthlyPrice: true,
          yearlyPrice: true
        }
      }
    }
  })

  return subscriptions.reduce((total, subscription) => {
    const price =
      subscription.billingCycle === 'YEARLY'
        ? subscription.plan.yearlyPrice
        : subscription.plan.monthlyPrice

    return total + Number(price)
  }, 0)
}
