import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import CategoryDetails from '@views/categories/CategoryDetails'

export const metadata: Metadata = {
  title: 'Category Details'
}

// Same RBAC as the Categories directory (categories/page.tsx): Business
// Owner, Manager, Accountant can view; Employee cannot. See
// CATEGORY_MODULE_VIEW_ROLES in the backend's constants/roles.ts, which
// GET /categories/:id also enforces independently.
const CategoryDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <CategoryDetails categoryId={id} />
    </RoleGuard>
  )
}

export default CategoryDetailsPage
