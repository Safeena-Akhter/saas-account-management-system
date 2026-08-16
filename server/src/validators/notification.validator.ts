import { z } from "zod";

// Kept in sync with the Prisma NotificationType enum by hand (Zod has no
// direct "derive from Prisma enum" helper without extra codegen) - same
// approach invoice.validator.ts and payment.validator.ts already use for
// their status/type enums.
export const notificationTypeSchema = z.enum([
  "INVOICE_CREATED",
  "INVOICE_PAID",
  "PAYMENT_RECEIVED",
  "EXPENSE_ADDED",
  "LOW_STOCK",
  "NEW_USER_INVITATION",
  "COMPANY_UPDATED",
  "SUBSCRIPTION_EXPIRY",
  "SYSTEM"
]);

// GET /notifications?isRead=...&type=...&page=...&pageSize=...
// z.coerce because query string values arrive as strings even for the
// boolean param - `?isRead=false` is `req.query.isRead === "false"`. Same
// shape as listCategoriesQuerySchema.
export const listNotificationsQuerySchema = z.object({
  isRead: z.coerce.boolean().optional(),
  type: notificationTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
