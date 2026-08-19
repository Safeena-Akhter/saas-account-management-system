// Mirrors the shape returned by server/src/services/subscription.service.ts
// (via subscription.repository.ts's Prisma rows, `plan`/`company` included)
// - keep in sync if backend fields change. See features/plans/types.ts for
// the sibling Plan type these embed.

import type { Plan } from '@/features/plans/types'

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
export type BillingCycle = 'MONTHLY' | 'YEARLY'

export type CompanySubscription = {
  id: string
  status: SubscriptionStatus
  billingCycle: BillingCycle
  startDate: string
  endDate: string
  companyId: string
  planId: string
  company: { id: string; name: string }
  plan: Plan
  createdAt: string
  updatedAt: string
}

// GET /subscriptions/me - includes remainingDays (server-computed, not
// stored) on top of the plain CompanySubscription row.
export type MySubscription = CompanySubscription & { remainingDays: number }

export type UsageEntry = {
  used: number
  limit: number | null
  percentUsed: number
}

export type LimitedResource = 'users' | 'customers' | 'suppliers' | 'products' | 'categories' | 'invoices'

// GET /subscriptions/me/usage
export type UsageSummary = {
  subscription: CompanySubscription
  usage: Record<LimitedResource, UsageEntry>

  // Captured on the plan but not yet enforced anywhere in the app - see
  // planLimit.service.ts's top-of-file comment on the server.
  unenforced: {
    maxMonthlyReports: number | null
    storageLimitMb: number | null
    uploadLimitMb: number | null
    apiRequestLimit: number | null
  }
}

export type ChangeMySubscriptionInput = {
  planId: string
  billingCycle: BillingCycle
}

// POST /subscriptions (Super Admin assign)
export type AssignSubscriptionInput = {
  companyId: string
  planId: string
  billingCycle: BillingCycle
  startDate?: string
  endDate: string
}
