import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import MonthlySummaryReport from '@views/reports/MonthlySummaryReport'

export const metadata: Metadata = {
  title: 'Monthly Summary Report'
}

const MonthlySummaryReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <MonthlySummaryReport />
    </RoleGuard>
  )
}

export default MonthlySummaryReportPage
