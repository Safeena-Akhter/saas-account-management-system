import { prisma } from "../config/db";


function monthlyEquivalent(billingCycle: "MONTHLY" | "YEARLY", monthlyPrice: unknown, yearlyPrice: unknown) {
  return billingCycle === "YEARLY" ? Number(yearlyPrice) / 12 : Number(monthlyPrice);
}


const REVENUE_STATUSES = ["ACTIVE", "TRIAL"] as const;

export async function getRevenueSubscriptions() {
  return prisma.companySubscription.findMany({
    where: { status: { in: [...REVENUE_STATUSES] } },
    select: {
      billingCycle: true,
      status: true,
      company: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true, monthlyPrice: true, yearlyPrice: true } }
    }
  });
}

export { monthlyEquivalent };
