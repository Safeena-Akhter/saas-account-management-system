import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import RoleGuard from '@/hocs/RoleGuard'
import EmployeeDashboardView from '@views/dashboards/employee/EmployeeDashboardView'

export const metadata: Metadata = {
  title: 'Employee Dashboard'
}

const EmployeeDashboardPage = async () => {
  const session = await getServerSession(authOptions)

  return (
    <RoleGuard allowedRoles={['EMPLOYEE']}>
      <EmployeeDashboardView userName={session?.user.name ?? 'Employee'} companyName={session?.user.company?.name} />
    </RoleGuard>
  )
}

export default EmployeeDashboardPage
