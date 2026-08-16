import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import CompanySubscriptionsTable from '@views/subscriptions/CompanySubscriptionsTable'

export const metadata: Metadata = {
  title: 'Company Subscriptions'
}

// Super Admin only - "Assign Plan" + "View All Company Subscriptions" per
// the Subscription Management module's Super Admin section. Server-side
// enforcement lives on POST/GET /subscriptions (requireRole("SUPER_ADMIN")
// in server/src/routes/subscription.routes.ts) - this RoleGuard is the
// matching client-side page gate.
const CompanySubscriptionsPage = () => {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <CompanySubscriptionsTable />
    </RoleGuard>
  )
}

export default CompanySubscriptionsPage
