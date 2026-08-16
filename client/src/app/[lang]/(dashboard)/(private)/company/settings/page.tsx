import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import CompanySettings from '@views/company/CompanySettings'

export const metadata: Metadata = {
  title: 'Company Settings'
}

// Every company-scoped role can view this page; CompanySettings itself
// disables the form fields for anyone who isn't BUSINESS_OWNER. Super Admin
// is deliberately excluded - they have no company (companyId = null).
const CompanySettingsPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE']}>
      <CompanySettings />
    </RoleGuard>
  )
}

export default CompanySettingsPage
