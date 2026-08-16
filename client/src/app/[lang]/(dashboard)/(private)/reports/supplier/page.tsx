import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import SupplierReport from '@views/reports/SupplierReport'

export const metadata: Metadata = {
  title: 'Supplier Report'
}

const SupplierReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <SupplierReport />
    </RoleGuard>
  )
}

export default SupplierReportPage
