// Mirrors the shapes returned by server/src/services/platformUser.service.ts
// - keep in sync if backend fields change.

export type PlatformUserCompany = {
  id: string
  name: string
  isActive: boolean
} | null

export type PlatformUserListItem = {
  id: string
  name: string
  email: string
  role: 'BUSINESS_OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE'
  isActive: boolean
  createdAt: string
  emailVerifiedAt: string | null
  company: PlatformUserCompany
}

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListPlatformUsersParams = Partial<{
  search: string
  companyId: string
  role: PlatformUserListItem['role']
  status: 'active' | 'inactive' | 'all'
  page: number
  pageSize: number
}>
