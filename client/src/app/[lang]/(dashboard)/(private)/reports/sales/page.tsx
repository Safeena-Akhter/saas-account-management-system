import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import SalesReport from '@views/reports/SalesReport'

export const metadata: Metadata = {
  title: 'Sales Report'
}

const SalesReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <SalesReport />
    </RoleGuard>
  )
}

export default SalesReportPage
