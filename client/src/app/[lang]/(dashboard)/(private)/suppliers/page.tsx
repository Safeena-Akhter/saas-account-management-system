import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import SuppliersTable from '@views/suppliers/SuppliersTable'

export const metadata: Metadata = {
  title: 'Suppliers'
}

// Business Owner (full access), Manager (create/update/view), Accountant
// (view only) per module spec - Employee excluded (was previously included
// here, a bug: Employee has no access to this module, and GET /suppliers
// now enforces the same via SUPPLIER_MODULE_VIEW_ROLES server-side).
const SuppliersPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <SuppliersTable />
    </RoleGuard>
  )
}

export default SuppliersPage
