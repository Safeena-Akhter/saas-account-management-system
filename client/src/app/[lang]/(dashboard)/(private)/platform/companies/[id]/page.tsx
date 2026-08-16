import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import CompanyDetailsView from '@views/platform-companies/CompanyDetailsView'

export const metadata: Metadata = {
  title: 'Company Details'
}

// SUPER_ADMIN only - same RBAC pattern as the companies list
// (platform/companies/page.tsx).
const PlatformCompanyDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <CompanyDetailsView companyId={id} />
    </RoleGuard>
  )
}

export default PlatformCompanyDetailsPage
