import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import TaxReport from '@views/reports/TaxReport'

export const metadata: Metadata = {
  title: 'Tax Report'
}

const TaxReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <TaxReport />
    </RoleGuard>
  )
}

export default TaxReportPage
