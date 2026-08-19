// Mirrors the shape returned by server/src/services/platformRevenue.service.ts
// - keep in sync if backend fields change.

export type RevenueByPlan = {
  planId: string
  planName: string
  subscriptions: number
  mrr: number
}

export type RevenueByBillingCycle = {
  MONTHLY: { subscriptions: number; mrr: number }
  YEARLY: { subscriptions: number; mrr: number }
}

export type RevenueCompany = {
  companyId: string
  companyName: string
  planName: string
  billingCycle: 'MONTHLY' | 'YEARLY'
  status: 'ACTIVE' | 'TRIAL'
  mrr: number
}

export type PlatformRevenueOverview = {
  mrr: number
  arr: number
  payingSubscriptions: number
  byPlan: RevenueByPlan[]
  byBillingCycle: RevenueByBillingCycle
  topCompanies: RevenueCompany[]
}
