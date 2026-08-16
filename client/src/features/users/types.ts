// Keep in sync with server/src/constants/roles.ts. This client-side copy is
// purely for UI decisions (which buttons/role options to show) - it is NOT
// itself a security boundary. The server re-checks every one of these rules
// independently and is the only thing that actually enforces them.

export type AppRole = 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE'

// Roles assignable through this module. BUSINESS_OWNER is included because
// ownership isn't capped at one seat - a company can have more than one
// Business Owner, which is also why the server enforces a "don't
// demote/deactivate/delete the last active owner" rule instead of simply
// forbidding owner-role changes outright.
export type AssignableRole = 'BUSINESS_OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE'

// Per the Phase 3 RBAC spec: only the Business Owner can create, edit,
// activate, deactivate, delete, or reassign roles for users. Managers can
// view the list (see USER_MANAGEMENT_VIEW_ROLES-gated page access) but have
// no manageable roles of their own - every write action is hidden for them
// in the UI, and would be rejected server-side even if it weren't.
export const MANAGEABLE_ROLES: Record<AppRole, AssignableRole[]> = {
  SUPER_ADMIN: [],
  BUSINESS_OWNER: ['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE'],
  MANAGER: [],
  ACCOUNTANT: [],
  EMPLOYEE: []
}

// Roles an owner can actually ASSIGN, on create or on role-reassignment -
// deliberately narrower than MANAGEABLE_ROLES (see
// server/src/constants/roles.ts's INVITABLE_ROLES, which this mirrors).
// MANAGEABLE_ROLES answers "can the owner act on a user with this role at
// all" (still includes BUSINESS_OWNER, for managing a fellow owner); this
// answers "what value can `role` be set to" - never Business Owner or
// Super Admin.
export const INVITABLE_ROLES: AssignableRole[] = ['MANAGER', 'ACCOUNTANT', 'EMPLOYEE']

export function canManageRole(actorRole: AppRole | undefined, targetRole: AppRole): boolean {
  if (!actorRole) return false

  return (MANAGEABLE_ROLES[actorRole] as AppRole[]).includes(targetRole)
}

export type CompanyUser = {
  id: string
  name: string
  email: string
  role: AppRole
  isActive: boolean
  emailVerifiedAt: string | null
  createdAt: string
}

// No `password` field: the owner never sets one. The backend generates a
// secure temporary password (hashed, never returned) and emails the new
// user an invitation link to set their own - see
// server/src/services/user.service.ts's createCompanyUser.
export type CreateUserInput = {
  name: string
  email: string
  role: AssignableRole
}

export type UpdateUserInput = Partial<{
  name: string
  role: AssignableRole
  isActive: boolean
}>

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListUsersParams = {
  search?: string
  page?: number
  pageSize?: number
}

export type UsersPage = {
  users: CompanyUser[]
  pagination: Pagination
}
