import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import IncomeReport from '@views/reports/IncomeReport'

export const metadata: Metadata = {
  title: 'Income Report'
}

const IncomeReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <IncomeReport />
    </RoleGuard>
  )
}

export default IncomeReportPage
