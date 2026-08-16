import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import ProfitLossReport from '@views/reports/ProfitLossReport'

export const metadata: Metadata = {
  title: 'Profit & Loss Report'
}

const ProfitLossReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <ProfitLossReport />
    </RoleGuard>
  )
}

export default ProfitLossReportPage
