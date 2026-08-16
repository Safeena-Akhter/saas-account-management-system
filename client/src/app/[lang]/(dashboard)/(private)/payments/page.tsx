import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import PaymentsTable from '@views/payments/PaymentsTable'

export const metadata: Metadata = {
  title: 'Payments'
}

const PaymentsPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE']}>
      <PaymentsTable />
    </RoleGuard>
  )
}

export default PaymentsPage
