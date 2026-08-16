import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import ReportsDashboard from '@views/reports/ReportsDashboard'

export const metadata: Metadata = {
  title: 'Reports'
}

// RBAC per Reports & Analytics module spec: Business Owner (Full Access),
// Manager (View + Export), Accountant (Full Reports Access), Employee (No
// Reports). Matches REPORT_MODULE_VIEW_ROLES in the backend's
// constants/roles.ts, which every /reports/* API route enforces server-side
// - this guard is the frontend's defense-in-depth layer, same pattern as
// every other module's page.tsx.
const ReportsPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <ReportsDashboard />
    </RoleGuard>
  )
}

export default ReportsPage
