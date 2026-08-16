import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import RoleGuard from '@/hocs/RoleGuard'
import SuperAdminDashboardView from '@views/dashboards/super-admin/SuperAdminDashboardView'

export const metadata: Metadata = {
  title: 'Super Admin Dashboard'
}

const SuperAdminDashboardPage = async () => {
  const session = await getServerSession(authOptions)

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <SuperAdminDashboardView userName={session?.user.name ?? 'Super Admin'} />
    </RoleGuard>
  )
}

export default SuperAdminDashboardPage
