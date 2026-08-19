import { getRevenueSubscriptions, monthlyEquivalent } from "../repositories/platformRevenue.repository";

const TOP_COMPANIES_LIMIT = 10;

export async function getRevenueOverview() {
  const subscriptions = await getRevenueSubscriptions();

  let mrr = 0;

  const byPlan = new Map<string, { planId: string; planName: string; subscriptions: number; mrr: number }>();
  const byBillingCycle = {
    MONTHLY: { subscriptions: 0, mrr: 0 },
    YEARLY: { subscriptions: 0, mrr: 0 }
  };

  const companies: { companyId: string; companyName: string; planName: string; billingCycle: string; status: string; mrr: number }[] =
    [];

  for (const sub of subscriptions) {
    const billingCycle = sub.billingCycle as "MONTHLY" | "YEARLY";
    const contribution = monthlyEquivalent(billingCycle, sub.plan.monthlyPrice, sub.plan.yearlyPrice);

    mrr += contribution;

    const planEntry = byPlan.get(sub.plan.id) ?? {
      planId: sub.plan.id,
      planName: sub.plan.name,
      subscriptions: 0,
      mrr: 0
    };

    planEntry.subscriptions += 1;
    planEntry.mrr += contribution;
    byPlan.set(sub.plan.id, planEntry);

    byBillingCycle[billingCycle].subscriptions += 1;
    byBillingCycle[billingCycle].mrr += contribution;

    companies.push({
      companyId: sub.company.id,
      companyName: sub.company.name,
      planName: sub.plan.name,
      billingCycle,
      status: sub.status,
      mrr: contribution
    });
  }

  const topCompanies = companies.sort((a, b) => b.mrr - a.mrr).slice(0, TOP_COMPANIES_LIMIT);

  return {
    mrr,
    // Annualized run rate - a simple x12 projection of current MRR, same
    // "derive one comparable number from the billing-cycle design"
    // approach dashboard.repository.ts's platformRevenue() comment
    // describes, not a forecast that accounts for churn/growth.
    arr: mrr * 12,
    payingSubscriptions: subscriptions.length,
    byPlan: Array.from(byPlan.values()).sort((a, b) => b.mrr - a.mrr),
    byBillingCycle,
    topCompanies
  };
}
