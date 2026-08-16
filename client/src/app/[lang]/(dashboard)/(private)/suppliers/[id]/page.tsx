import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import SupplierDetails from '@views/suppliers/SupplierDetails'

export const metadata: Metadata = {
  title: 'Supplier Details'
}

// Same RBAC as the Suppliers directory (suppliers/page.tsx): Business
// Owner, Manager, Accountant can view; Employee cannot. See
// SUPPLIER_MODULE_VIEW_ROLES in the backend's constants/roles.ts, which
// GET /suppliers/:id also enforces independently.
const SupplierDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <SupplierDetails supplierId={id} />
    </RoleGuard>
  )
}

export default SupplierDetailsPage
