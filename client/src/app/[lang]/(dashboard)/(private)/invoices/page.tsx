import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import InvoicesTable from '@views/invoices/InvoicesTable'

export const metadata: Metadata = {
  title: 'Invoices'
}

const InvoicesPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE']}>
      <InvoicesTable />
    </RoleGuard>
  )
}

export default InvoicesPage
