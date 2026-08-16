export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE' | 'ONLINE' | 'OTHER'

export type PaymentType = 'RECEIVED' | 'PAID'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type Payment = {
  id: string
  amount: string
  method: PaymentMethod
  type: PaymentType
  status: PaymentStatus
  paymentDate: string
  reference: string | null
  notes: string | null
  invoiceId: string | null
  invoice: { id: string; invoiceNumber: string; totalAmount: string } | null
  customerId: string | null
  customer: { id: string; name: string } | null
  supplierId: string | null
  supplier: { id: string; name: string } | null
  createdAt: string
}

// Receive Customer Payment - status defaults to COMPLETED server-side, but
// can be explicitly set to PENDING (e.g. a cheque not yet banked).
export type CreatePaymentInput = {
  invoiceId?: string | null
  customerId?: string | null
  amount: number
  method: PaymentMethod
  status?: Extract<PaymentStatus, 'PENDING' | 'COMPLETED'>
  paymentDate?: string
  reference?: string | null
  notes?: string | null
}

// Supplier Payment - money paid out, paying down what's owed to a supplier.
export type CreateSupplierPaymentInput = {
  supplierId: string
  amount: number
  method: PaymentMethod
  status?: Extract<PaymentStatus, 'PENDING' | 'COMPLETED'>
  paymentDate?: string
  reference?: string | null
  notes?: string | null
}

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PaymentsPage = {
  payments: Payment[]
  pagination: Pagination
}

export type ListPaymentsParams = {
  type?: PaymentType
  status?: PaymentStatus
  invoiceId?: string
  customerId?: string
  supplierId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'paymentDate' | 'amount' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
