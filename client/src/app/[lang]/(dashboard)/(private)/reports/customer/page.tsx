import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import CustomerReport from '@views/reports/CustomerReport'

export const metadata: Metadata = {
  title: 'Customer Report'
}

const CustomerReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <CustomerReport />
    </RoleGuard>
  )
}

export default CustomerReportPage
