import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import PlatformUsersTable from '@views/platform-users/PlatformUsersTable'

export const metadata: Metadata = {
  title: 'Platform Users'
}

// SUPER_ADMIN only - server-side enforcement lives on /api/v1/platform/users
// (requireRole("SUPER_ADMIN") in server/src/routes/platformUser.routes.ts);
// this RoleGuard is the matching client-side page gate, same pattern as
// platform/companies/page.tsx.
const PlatformUsersPage = () => {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <PlatformUsersTable />
    </RoleGuard>
  )
}

export default PlatformUsersPage
