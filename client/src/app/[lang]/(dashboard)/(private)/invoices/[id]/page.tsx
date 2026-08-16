import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import InvoiceDetails from '@views/invoices/InvoiceDetails'

export const metadata: Metadata = {
  title: 'Invoice Details'
}

// Same RBAC as the Invoices directory (invoices/page.tsx): Business Owner,
// Manager, Accountant, and Employee can all view (per spec, Employee =
// View). GET /invoices/:id also enforces this independently on the
// backend (see invoice.routes.ts - view is unguarded for every company
// role).
const InvoiceDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE']}>
      <InvoiceDetails invoiceId={id} />
    </RoleGuard>
  )
}

export default InvoiceDetailsPage
