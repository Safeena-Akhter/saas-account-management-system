import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import PaymentReport from '@views/reports/PaymentReport'

export const metadata: Metadata = {
  title: 'Payment Report'
}

const PaymentReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <PaymentReport />
    </RoleGuard>
  )
}

export default PaymentReportPage
