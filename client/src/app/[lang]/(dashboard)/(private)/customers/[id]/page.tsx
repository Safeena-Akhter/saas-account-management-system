import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import CustomerDetails from '@views/customers/CustomerDetails'

export const metadata: Metadata = {
  title: 'Customer Details'
}

// Same RBAC as the Customers directory (customers/page.tsx): Business
// Owner, Manager, Accountant can view; Employee cannot. See
// CUSTOMER_MODULE_VIEW_ROLES in the backend's constants/roles.ts, which
// GET /customers/:id also enforces independently.
const CustomerDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <CustomerDetails customerId={id} />
    </RoleGuard>
  )
}

export default CustomerDetailsPage
