import { z } from "zod";

const moneySchema = z
  .number({ message: "Must be a number" })
  .nonnegative("Must be zero or greater")
  .max(999_999_999.99, "Value is too large");

const invoiceItemSchema = z.object({
  productId: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().min(1, "Description is required").max(300),
  quantity: z.number({ message: "Must be a number" }).int("Must be a whole number").positive("Must be at least 1"),
  unitPrice: moneySchema
});

export const createInvoiceSchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required"),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date({ message: "Due date is required" }),
  taxAmount: moneySchema.default(0),
  discountAmount: moneySchema.default(0),
  notes: z.string().trim().max(1000).nullable().optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item")
});

// Edit an existing invoice (Draft/Sent, no payments recorded yet - see the
// guard in invoice.service.ts#updateInvoice). Every field is optional so a
// caller can PATCH just e.g. `notes` or `dueDate` without resending the
// full line-item set, but `items`, when present, replaces the set wholesale
// (matches how the create form and edit dialog build the payload).
export const updateInvoiceSchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required").optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  taxAmount: moneySchema.optional(),
  discountAmount: moneySchema.optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item").optional()
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"])
});

// GET /invoices?search=...&status=...&customerId=...&sortBy=...&sortOrder=...
// &page=...&pageSize=...
//
// pageSize's default (200) is generous for the same reason as Customer's
// (see listCustomersQuerySchema): GET /invoices with no params at all is
// also how the Payments module's invoice picker (useInvoices()) and any
// other unpaginated caller expect to get the full roster back, not just
// page 1. The dedicated Invoices directory page always passes its own
// explicit pageSize.
//
// `search` matches against invoiceNumber or the linked customer's name
// (see invoice.repository.ts's findManyByCompany `OR` clause).
export const listInvoiceQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  customerId: z.string().trim().min(1).optional(),
  dueFrom: z.coerce.date().optional(),
  dueTo: z.coerce.date().optional(),
  sortBy: z.enum(["issueDate", "dueDate", "invoiceNumber", "totalAmount", "status"]).default("issueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200)
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type ListInvoiceQuery = z.infer<typeof listInvoiceQuerySchema>;
