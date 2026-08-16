export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: string
  total: string
  productId: string | null
}

export type InvoicePaymentSummary = {
  id: string
  amount: string
  method: string
  paymentDate: string
  reference: string | null
}

export type Invoice = {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  subtotal: string
  taxAmount: string
  discountAmount: string
  totalAmount: string
  amountPaid: string
  notes: string | null
  customerId: string
  customer: { id: string; name: string; email: string | null }
  items: InvoiceItem[]
  payments: InvoicePaymentSummary[]
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateInvoiceItemInput = {
  productId?: string | null
  description: string
  quantity: number
  unitPrice: number
}

export type CreateInvoiceInput = {
  customerId: string
  dueDate: string
  issueDate?: string
  taxAmount: number
  discountAmount: number
  notes?: string | null
  items: CreateInvoiceItemInput[]
}

// Every field optional - a PATCH can touch just one field (e.g. `notes`) or
// resend the full line-item set. See invoice.validator.ts#updateInvoiceSchema.
export type UpdateInvoiceInput = Partial<CreateInvoiceInput>

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type InvoicesPage = {
  invoices: Invoice[]
  pagination: Pagination
}

export type ListInvoicesParams = {
  search?: string
  status?: InvoiceStatus
  customerId?: string
  dueFrom?: string
  dueTo?: string
  sortBy?: 'issueDate' | 'dueDate' | 'invoiceNumber' | 'totalAmount' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
