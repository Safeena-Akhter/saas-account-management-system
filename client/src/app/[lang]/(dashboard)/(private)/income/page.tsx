import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import IncomesTable from '@views/income/IncomesTable'

export const metadata: Metadata = {
  title: 'Income'
}

// Matches INCOME_MODULE_VIEW_ROLES on the server (Owner/Manager/Accountant)
// - same shape as the Expenses page, Income's "money out" peer.
const IncomePage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <IncomesTable />
    </RoleGuard>
  )
}

export default IncomePage
