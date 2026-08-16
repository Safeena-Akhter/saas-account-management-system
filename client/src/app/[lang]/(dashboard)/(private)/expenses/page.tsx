import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import ExpensesTable from '@views/expenses/ExpensesTable'

export const metadata: Metadata = {
  title: 'Expenses'
}

const ExpensesPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <ExpensesTable />
    </RoleGuard>
  )
}

export default ExpensesPage
