import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import UserManagementTable from '@views/user-management/UserManagementTable'

export const metadata: Metadata = {
  title: 'User Management'
}

// Matches the backend's USER_MANAGEMENT_VIEW_ROLES exactly (see
// server/src/constants/roles.ts) - Accountants and Employees never reach
// this page; server-side RoleGuard renders NotAuthorized instead of the
// table if they somehow navigate here directly. Within the page itself,
// only Business Owners get write access (see UserManagementTable) - Managers
// see the same table read-only, per the RBAC spec.
const UserManagementPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER']}>
      <UserManagementTable />
    </RoleGuard>
  )
}

export default UserManagementPage
