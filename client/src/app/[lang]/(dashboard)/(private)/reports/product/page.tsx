import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import ProductReport from '@views/reports/ProductReport'

export const metadata: Metadata = {
  title: 'Product Report'
}

const ProductReportPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']}>
      <ProductReport />
    </RoleGuard>
  )
}

export default ProductReportPage
