import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import OutstandingBalanceReport from '@views/reports/OutstandingBalanceReport'

export const metadata: Metadata = {
  title: 'Outstanding Balance Report'
}

const OutstandingBalanceReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <OutstandingBalanceReport />
    </RoleGuard>
  )
}

export default OutstandingBalanceReportPage
