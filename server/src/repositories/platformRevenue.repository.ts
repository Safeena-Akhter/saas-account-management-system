import { prisma } from "../config/db";

// Same monthly-normalization dashboard.repository.ts's platformRevenue()
// uses: a YEARLY subscription's contribution to *monthly* recurring
// revenue is its yearly price divided by 12, so a $1200/yr plan and a
// $100/mo plan both count as $100 MRR - directly comparable regardless of
// which cycle the company is on.
function monthlyEquivalent(billingCycle: "MONTHLY" | "YEARLY", monthlyPrice: unknown, yearlyPrice: unknown) {
  return billingCycle === "YEARLY" ? Number(yearlyPrice) / 12 : Number(monthlyPrice);
}

// Only ACTIVE and TRIAL subscriptions count toward revenue - EXPIRED/
// CANCELLED aren't currently paying anything. TRIAL is included
// deliberately (not excluded as "not yet paying"): the app has no
// separate "trial price" concept - a TRIAL subscription is provisioned on
// the same plan/price a paying one would be, per assignSubscriptionSchema
// (no discount field) - so until a company converts or the trial expires,
// it reads as pipeline/at-risk revenue rather than zero.
const REVENUE_STATUSES = ["ACTIVE", "TRIAL"] as const;

export async function getRevenueSubscriptions() {
  return prisma.companySubscription.findMany({
    where: { status: { in: REVENUE_STATUSES } },
    select: {
      billingCycle: true,
      status: true,
      company: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true, monthlyPrice: true, yearlyPrice: true } }
    }
  });
}

export { monthlyEquivalent };
