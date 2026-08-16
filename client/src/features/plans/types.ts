// Mirrors the shape returned by server/src/services/plan.service.ts (via
// plan.repository.ts's Prisma rows) - keep these in sync if backend fields
// change.

export type BillingCycle = 'MONTHLY' | 'YEARLY'

export type Plan = {
  id: string
  name: string
  description: string | null
  monthlyPrice: string
  yearlyPrice: string

  // Ordered marketing bullet points for the pricing page - distinct from
  // the structured limits below.
  features: string[] | null

  // Feature Limits - null means unlimited (see schema.prisma's comment on
  // Plan for why null rather than a large sentinel number).
  maxUsers: number | null
  maxCustomers: number | null
  maxSuppliers: number | null
  maxProducts: number | null
  maxCategories: number | null
  maxInvoices: number | null
  maxMonthlyReports: number | null
  storageLimitMb: number | null
  uploadLimitMb: number | null

  // Future-ready per the module spec - stored, not yet enforced anywhere
  // in the app (no API rate limiter exists yet to check it against).
  apiRequestLimit: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PlanLimitFields = Partial<{
  maxUsers: number | null
  maxCustomers: number | null
  maxSuppliers: number | null
  maxProducts: number | null
  maxCategories: number | null
  maxInvoices: number | null
  maxMonthlyReports: number | null
  storageLimitMb: number | null
  uploadLimitMb: number | null
  apiRequestLimit: number | null
}>

export type CreatePlanInput = PlanLimitFields & {
  name: string
  description?: string | null
  monthlyPrice: number
  yearlyPrice: number
  features?: string[] | null
}

export type UpdatePlanInput = PlanLimitFields &
  Partial<{
    name: string
    description: string | null
    monthlyPrice: number
    yearlyPrice: number
    features: string[] | null
    isActive: boolean
  }>
