import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import CategoriesTable from '@views/categories/CategoriesTable'

export const metadata: Metadata = {
  title: 'Categories'
}

// Per the Category Management RBAC spec: Business Owner (full access),
// Manager (CRUD), Accountant (view only), Employee (no access). Employee is
// deliberately excluded here - unlike Customer, there's no "still needs a
// narrower picker lookup elsewhere" carve-out, since Employees can't
// create/edit Products either. See CATEGORY_MODULE_VIEW_ROLES in the
// backend's constants/roles.ts, which GET /categories also enforces
// independently.
const CategoriesPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <CategoriesTable />
    </RoleGuard>
  )
}

export default CategoriesPage
