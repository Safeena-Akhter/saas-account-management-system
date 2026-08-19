// Mirrors the shapes returned by
// server/src/services/platformCompany.service.ts - keep these in sync if
// backend fields change.

export type CompanyOwner = {
  id: string
  name: string
  email: string
  isActive: boolean
} | null

export type CompanyListItem = {
  id: string
  name: string
  logoUrl: string | null
  contactEmail: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  owner: CompanyOwner
  _count: { users: number; customers: number; products: number; invoices: number }
  subscriptions: {
    billingCycle: 'MONTHLY' | 'YEARLY'
    status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
    endDate: string
    plan: { id: string; name: string }
  }[]
}

export type CompanyDetails = {
  id: string
  name: string
  logoUrl: string | null
  contactEmail: string | null
  phone: string | null
  address: string | null
  taxNumber: string | null
  currency: string
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type CompanySubscriptionInfo = {
  planId: string
  planName: string
  billingCycle: 'MONTHLY' | 'YEARLY'
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
  startDate: string
  endDate: string
  renewalStatus: string
} | null

export type CompanyStats = {
  users: number
  customers: number
  suppliers: number
  products: number
  invoices: number
  expenses: number
  incomes: number
  payments: number
}

export type CompanyDetailsResponse = {
  company: CompanyDetails
  owner: CompanyOwner
  subscription: CompanySubscriptionInfo
  stats: CompanyStats
}

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListCompaniesParams = Partial<{
  search: string
  status: 'active' | 'suspended' | 'all'
  planId: string
  dateFrom: string
  dateTo: string
  sortBy: 'name' | 'createdAt' | 'users'
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}>

export type CompanyUserListItem = {
  id: string
  name: string
  email: string
  role: 'BUSINESS_OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE'
  isActive: boolean
  emailVerifiedAt: string | null
  createdAt: string
}

export type ListCompanyUsersParams = Partial<{
  search: string
  role: CompanyUserListItem['role']
  status: 'active' | 'inactive' | 'all'
  page: number
  pageSize: number
}>

export type UpdateCompanyInput = Partial<{
  name: string
  address: string | null
  phone: string | null
  contactEmail: string | null
  taxNumber: string | null
  currency: string
}>
