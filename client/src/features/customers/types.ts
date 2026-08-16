export type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  creditLimit: string // Prisma Decimal is serialized as a string over JSON
  isActive: boolean
  companyId: string
  createdAt: string
  updatedAt: string
}

export type CreateCustomerInput = {
  name: string
  phone: string
  email?: string | null
  address?: string | null
  notes?: string | null
  creditLimit?: number
}

export type UpdateCustomerInput = Partial<
  Omit<CreateCustomerInput, 'phone'> & { phone: string; isActive: boolean }
>

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CustomersPage = {
  customers: Customer[]
  pagination: Pagination
}

export type ListCustomersParams = {
  search?: string
  isActive?: boolean
  sortBy?: 'name' | 'email' | 'createdAt' | 'creditLimit'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type CustomerInvoiceSummary = {
  id: string
  invoiceNumber: string
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  issueDate: string
  dueDate: string
  totalAmount: string
  amountPaid: string
}

export type CustomerPaymentSummary = {
  id: string
  amount: string
  method: string
  paymentDate: string
  reference: string | null
  invoice: { id: string; invoiceNumber: string } | null
}

export type CustomerActivityItem = {
  id: string
  type: 'customer' | 'invoice' | 'payment'
  label: string
  amount: number | null
  createdAt: string
}

export type CustomerDetails = {
  customer: Customer
  stats: {
    outstandingBalance: number
    creditLimit: number
    invoiceCount: number
    paymentCount: number
  }
  recentInvoices: CustomerInvoiceSummary[]
  recentPayments: CustomerPaymentSummary[]
  activity: CustomerActivityItem[]
}
