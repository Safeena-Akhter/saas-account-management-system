// Single source of truth for "which role goes to which dashboard".
// Used by: Login.tsx (post-login redirect), GuestOnlyRoute (already-logged-in
// redirect), AuthGuard (role-restricted route checks), and the sidebar menu
// (role-based item filtering).

export type AppRole = 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE'

export const ROLE_HOME_ROUTE: Record<AppRole, string> = {
  SUPER_ADMIN: '/dashboards/super-admin',
  BUSINESS_OWNER: '/dashboards/business-owner',
  MANAGER: '/dashboards/manager',
  ACCOUNTANT: '/dashboards/accountant',
  EMPLOYEE: '/dashboards/employee'
}

export const ROLE_LABEL: Record<AppRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  BUSINESS_OWNER: 'Business Owner',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Accountant',
  EMPLOYEE: 'Employee'
}

export function getHomeRouteForRole(role: string | undefined | null): string {
  if (role && role in ROLE_HOME_ROUTE) {
    return ROLE_HOME_ROUTE[role as AppRole]
  }

  // Fallback: if the role is somehow missing/unrecognized, send them
  // somewhere safe rather than into a role-specific dashboard they may not
  // have permission for.
  return '/login'
}
