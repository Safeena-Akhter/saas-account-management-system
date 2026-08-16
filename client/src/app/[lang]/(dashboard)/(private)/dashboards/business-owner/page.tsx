import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import RoleGuard from '@/hocs/RoleGuard'
import BusinessOwnerDashboardView from '@views/dashboards/business-owner/BusinessOwnerDashboardView'

export const metadata: Metadata = {
  title: 'Business Owner Dashboard'
}

const BusinessOwnerDashboardPage = async () => {
  const session = await getServerSession(authOptions)

  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER']}>
      <BusinessOwnerDashboardView
        userName={session?.user.name ?? 'Business Owner'}
        companyName={session?.user.company?.name}
      />
    </RoleGuard>
  )
}

export default BusinessOwnerDashboardPage
