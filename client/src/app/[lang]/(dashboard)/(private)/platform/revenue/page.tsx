import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import PlatformRevenueView from '@views/platform-revenue/PlatformRevenueView'

export const metadata: Metadata = {
  title: 'Platform Revenue'
}

// SUPER_ADMIN only - server-side enforcement lives on /api/v1/platform/revenue
// (requireRole("SUPER_ADMIN") in server/src/routes/platformRevenue.routes.ts);
// this RoleGuard is the matching client-side page gate, same pattern as
// platform/users/page.tsx.
const PlatformRevenuePage = () => {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <PlatformRevenueView />
    </RoleGuard>
  )
}

export default PlatformRevenuePage
