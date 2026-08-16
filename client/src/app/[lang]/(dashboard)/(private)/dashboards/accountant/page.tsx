import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import RoleGuard from '@/hocs/RoleGuard'
import AccountantDashboardView from '@views/dashboards/accountant/AccountantDashboardView'

export const metadata: Metadata = {
  title: 'Accountant Dashboard'
}

const AccountantDashboardPage = async () => {
  const session = await getServerSession(authOptions)

  return (
    <RoleGuard allowedRoles={['ACCOUNTANT']}>
      <AccountantDashboardView userName={session?.user.name ?? 'Accountant'} companyName={session?.user.company?.name} />
    </RoleGuard>
  )
}

export default AccountantDashboardPage
