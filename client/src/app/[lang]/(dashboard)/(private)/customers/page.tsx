import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import CustomersTable from '@views/customers/CustomersTable'

export const metadata: Metadata = {
  title: 'Customers'
}

// Per the Customer Management RBAC spec: Business Owner (full access),
// Manager (create/update/view), Accountant (view only), Employee (no
// access). Employee is deliberately excluded here even though they can
// still resolve a customer name/id through the Invoices/Payments "pick a
// customer" dropdown - that's a narrower, read-only lookup on a different
// endpoint, not access to this module. See customer.routes.ts and
// constants/roles.ts's CUSTOMER_MODULE_VIEW_ROLES for the backend side of
// this same rule.
const CustomersPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <CustomersTable />
    </RoleGuard>
  )
}

export default CustomersPage
