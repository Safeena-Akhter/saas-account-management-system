import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import PlatformCompaniesTable from '@views/platform-companies/PlatformCompaniesTable'

export const metadata: Metadata = {
  title: 'Companies'
}

// SUPER_ADMIN only - server-side enforcement lives on
// /api/v1/platform/companies (requireRole("SUPER_ADMIN") in
// server/src/routes/platformCompany.routes.ts); this RoleGuard is the
// matching client-side page gate, same pattern as
// (private)/company-subscriptions/page.tsx.
const PlatformCompaniesPage = () => {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <PlatformCompaniesTable />
    </RoleGuard>
  )
}

export default PlatformCompaniesPage
