// Mirrors the shape returned by server/src/services/notification.service.ts
// (via notification.repository.ts's Prisma rows) - keep these in sync if
// backend fields change. Same convention as features/company/types.ts.

export type NotificationType =
  | 'INVOICE_CREATED'
  | 'INVOICE_PAID'
  | 'PAYMENT_RECEIVED'
  | 'EXPENSE_ADDED'
  | 'LOW_STOCK'
  | 'NEW_USER_INVITATION'
  | 'COMPANY_UPDATED'
  | 'SUBSCRIPTION_EXPIRY'
  | 'SYSTEM'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  isRead: boolean
  readAt: string | null
  companyId: string
  userId: string
  createdAt: string
}

export type NotificationsPagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListNotificationsParams = Partial<{
  isRead: boolean
  type: NotificationType
  page: number
  pageSize: number
}>
