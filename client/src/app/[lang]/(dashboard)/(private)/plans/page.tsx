import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import PlansManagement from '@views/plans/PlansManagement'

export const metadata: Metadata = {
  title: 'Plans'
}

// Super Admin only - "Create Plan / Edit Plan / Delete Plan / Activate Plan
// / Deactivate Plan" per the Subscription Management module's Super Admin
// section. Server-side enforcement lives on the /plans routes themselves
// (requireRole("SUPER_ADMIN") in server/src/routes/plan.routes.ts) - this
// RoleGuard is the matching client-side page gate, same pattern as every
// other module's page.
const PlansPage = () => {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <PlansManagement />
    </RoleGuard>
  )
}

export default PlansPage
