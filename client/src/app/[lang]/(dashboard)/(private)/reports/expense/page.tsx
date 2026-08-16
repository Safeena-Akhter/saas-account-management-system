import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import ExpenseReport from '@views/reports/ExpenseReport'

export const metadata: Metadata = {
  title: 'Expense Report'
}

const ExpenseReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <ExpenseReport />
    </RoleGuard>
  )
}

export default ExpenseReportPage
