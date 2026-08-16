import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import InvoiceReport from '@views/reports/InvoiceReport'

export const metadata: Metadata = {
  title: 'Invoice Report'
}

const InvoiceReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <InvoiceReport />
    </RoleGuard>
  )
}

export default InvoiceReportPage
