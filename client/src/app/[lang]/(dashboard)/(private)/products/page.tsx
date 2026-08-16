import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import ProductsTable from '@views/products/ProductsTable'

export const metadata: Metadata = {
  title: 'Products'
}

const ProductsPage = () => {
  return (
    <RoleGuard allowedRoles={['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE']}>
      <ProductsTable />
    </RoleGuard>
  )
}

export default ProductsPage
