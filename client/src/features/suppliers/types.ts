export type Supplier = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  openingBalance: string // Prisma Decimal is serialized as a string over JSON
  isActive: boolean
  companyId: string
  createdAt: string
  updatedAt: string
}

export type CreateSupplierInput = {
  name: string
  phone: string
  email?: string | null
  address?: string | null
  notes?: string | null
  openingBalance?: number
}

export type UpdateSupplierInput = Partial<
  Omit<CreateSupplierInput, 'phone'> & { phone: string; isActive: boolean }
>

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type SuppliersPage = {
  suppliers: Supplier[]
  pagination: Pagination
}

export type ListSuppliersParams = {
  search?: string
  isActive?: boolean
  sortBy?: 'name' | 'email' | 'createdAt' | 'openingBalance'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

// One Expense row serves as both the "purchase" and its "payment" - see
// supplier.repository.ts's sumExpensesForSupplier comment for why this
// schema doesn't have a separate open-payable/partial-payment concept the
// way Invoice/Payment gives Customer.
export type SupplierExpenseSummary = {
  id: string
  title: string
  category: string
  amount: string
  expenseDate: string
  paymentMethod: string
}

export type SupplierActivityItem = {
  id: string
  type: 'supplier' | 'purchase' | 'payment'
  label: string
  amount: number | null
  createdAt: string
}

export type SupplierDetails = {
  supplier: Supplier
  stats: {

    // Advisory only, not a live-computed running balance - see
    // schema.prisma's Supplier.openingBalance comment.
    outstandingPayable: number
    openingBalance: number
    purchaseCount: number
    paymentCount: number
    totalPurchased: number
  }
  recentPurchases: SupplierExpenseSummary[]
  recentPayments: SupplierExpenseSummary[]
  activity: SupplierActivityItem[]
}
