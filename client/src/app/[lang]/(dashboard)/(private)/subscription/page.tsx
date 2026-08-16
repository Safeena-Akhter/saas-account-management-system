import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import SubscriptionOverview from '@views/subscriptions/SubscriptionOverview'

export const metadata: Metadata = {
  title: 'Subscription'
}

// Per SUBSCRIPTION_MODULE_VIEW_ROLES in server/src/constants/roles.ts:
// Business Owner (full self-service) and Manager (view only - enforced
// inside SubscriptionOverview itself, same pattern as Categories'
// WRITE_ROLES check). Accountant and Employee have no access at all, so
// they're excluded here entirely rather than seeing a read-only page - the
// module's RBAC spec says "No Access" for those two roles, not "view only".
const SubscriptionPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER']}>
      <SubscriptionOverview />
    </RoleGuard>
  )
}

export default SubscriptionPage
