import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import RoleGuard from '@/hocs/RoleGuard'
import ManagerDashboardView from '@views/dashboards/manager/ManagerDashboardView'

export const metadata: Metadata = {
  title: 'Manager Dashboard'
}

const ManagerDashboardPage = async () => {
  const session = await getServerSession(authOptions)

  return (
    <RoleGuard allowedRoles={['MANAGER']}>
      <ManagerDashboardView userName={session?.user.name ?? 'Manager'} companyName={session?.user.company?.name} />
    </RoleGuard>
  )
}

export default ManagerDashboardPage
