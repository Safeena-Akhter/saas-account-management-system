import {
  countInvoicesForCompany,
  countMatching,
  createInvoice as createInvoiceRow,
  findByIdAndCompany,
  findManyByCompany,
  restoreInvoice as restoreInvoiceRow,
  softDeleteInvoice as softDeleteInvoiceRow,
  updateInvoice as updateInvoiceRow,
  updateInvoiceStatus as updateInvoiceStatusRow
} from "../repositories/invoice.repository";
import { findByIdAndCompany as findCustomerByIdAndCompany } from "../repositories/customer.repository";
import { AppError } from "../utils/AppError";
import { createForRoles, notifyOrIgnore } from "./notification.service";
import { enforceLimit } from "./planLimit.service";
import { INVOICE_MODULE_WRITE_ROLES } from "../constants/roles";
import type { CreateInvoiceInput, ListInvoiceQuery, UpdateInvoiceInput } from "../validators/invoice.validator";

export async function listInvoices(companyId: string, query: ListInvoiceQuery) {
  const options = {
    where: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.dueFrom || query.dueTo
        ? {
            dueDate: {
              ...(query.dueFrom ? { gte: query.dueFrom } : {}),
              ...(query.dueTo ? { lte: query.dueTo } : {})
            }
          }
        : {})
    },
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    page: query.page,
    pageSize: query.pageSize
  };

  const [invoices, total] = await Promise.all([
    findManyByCompany(companyId, options),
    countMatching(companyId, options)
  ]);

  return {
    invoices,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize))
    }
  };
}

export async function getInvoice(companyId: string, invoiceId: string) {
  const invoice = await findByIdAndCompany(invoiceId, companyId);

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  return invoice;
}

async function nextInvoiceNumber(companyId: string) {
  const count = await countInvoicesForCompany(companyId);
  const year = new Date().getFullYear();

  // Not perfectly collision-proof under concurrent creates (no DB-level
  // sequence), but the (companyId, invoiceNumber) unique constraint means a
  // genuine race just surfaces as a 409 the client can retry, rather than
  // silently duplicating a number.
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

function calculateTotals(items: { quantity: number; unitPrice: number }[], taxAmount: number, discountAmount: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalAmount = subtotal + taxAmount - discountAmount;

  if (totalAmount < 0) {
    throw new AppError("Discount cannot exceed subtotal plus tax", 422);
  }

  return { subtotal, totalAmount };
}

export async function createInvoice(companyId: string, createdByUserId: string | null, input: CreateInvoiceInput) {
  // Plan.maxInvoices.
  await enforceLimit(companyId, "invoices");

  const customer = await findCustomerByIdAndCompany(input.customerId, companyId);

  if (!customer) {
    throw new AppError("Customer not found", 400);
  }

  const { subtotal, totalAmount } = calculateTotals(input.items, input.taxAmount, input.discountAmount);

  const invoiceNumber = await nextInvoiceNumber(companyId);

  const invoice = await createInvoiceRow(companyId, {
    invoiceNumber,
    status: "SENT",
    issueDate: input.issueDate ?? new Date(),
    dueDate: input.dueDate,
    subtotal,
    taxAmount: input.taxAmount,
    discountAmount: input.discountAmount,
    totalAmount,
    notes: input.notes ?? null,
    customerId: input.customerId,
    createdByUserId,
    items: input.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      ...(item.productId ? { product: { connect: { id: item.productId } } } : {})
    }))
  });

  // Fire-and-forget: an invoice must exist successfully even if notifying
  // about it fails. Owner/Manager/Accountant (the same roles that can
  // manage invoices - see INVOICE_MODULE_WRITE_ROLES), never the actor who
  // just created it.
  void notifyOrIgnore(() =>
    createForRoles(
      companyId,
      INVOICE_MODULE_WRITE_ROLES,
      {
        type: "INVOICE_CREATED",
        title: "Invoice created",
        message: `Invoice ${invoice.invoiceNumber} for ${customer.name} was created.`,
        link: `/invoices/${invoice.id}`
      },
      createdByUserId ?? undefined
    )
  );

  return invoice;
}

// Full edit of an existing invoice. Blocked once money has actually moved
// against it (payments recorded) or it's been cancelled - at that point the
// invoice is a financial record, not a draft, and should be corrected via a
// credit note / new invoice rather than rewritten in place. Draft and Sent
// invoices with no payments yet are freely editable.
export async function updateInvoice(companyId: string, invoiceId: string, input: UpdateInvoiceInput) {
  const existing = await findByIdAndCompany(invoiceId, companyId);

  if (!existing) {
    throw new AppError("Invoice not found", 404);
  }

  if (existing.status === "CANCELLED") {
    throw new AppError("A cancelled invoice cannot be edited", 422);
  }

  if (Number(existing.amountPaid) > 0) {
    throw new AppError("An invoice with recorded payments cannot be edited", 422);
  }

  let customerId = existing.customerId;

  if (input.customerId && input.customerId !== existing.customerId) {
    const customer = await findCustomerByIdAndCompany(input.customerId, companyId);

    if (!customer) {
      throw new AppError("Customer not found", 400);
    }

    customerId = input.customerId;
  }

  const taxAmount = input.taxAmount ?? Number(existing.taxAmount);
  const discountAmount = input.discountAmount ?? Number(existing.discountAmount);

  const itemsForCalc = input.items ?? existing.items.map(i => ({ quantity: i.quantity, unitPrice: Number(i.unitPrice) }));
  const { subtotal, totalAmount } = calculateTotals(itemsForCalc, taxAmount, discountAmount);

  const updated = await updateInvoiceRow(invoiceId, {
    customerId,
    ...(input.issueDate ? { issueDate: input.issueDate } : {}),
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.items
      ? {
          items: input.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            ...(item.productId ? { product: { connect: { id: item.productId } } } : {})
          }))
        }
      : {})
  });

  return updated;
}

export async function updateInvoiceStatus(
  companyId: string,
  invoiceId: string,
  status: string,
  actorUserId?: string | null
) {
  const before = await findByIdAndCompany(invoiceId, companyId);

  const result = await updateInvoiceStatusRow(invoiceId, companyId, status as never);

  if (result.count === 0) {
    throw new AppError("Invoice not found", 404);
  }

  const invoice = await findByIdAndCompany(invoiceId, companyId);

  // Only fire on the DRAFT/SENT/PARTIALLY_PAID -> PAID transition, not
  // every subsequent no-op write that happens to already be PAID.
  if (invoice && before && before.status !== "PAID" && invoice.status === "PAID") {
    void notifyOrIgnore(() =>
      createForRoles(
        companyId,
        INVOICE_MODULE_WRITE_ROLES,
        {
          type: "INVOICE_PAID",
          title: "Invoice paid",
          message: `Invoice ${invoice.invoiceNumber} for ${invoice.customer.name} is now fully paid.`,
          link: `/invoices/${invoice.id}`
        },
        actorUserId ?? undefined
      )
    );
  }

  return invoice;
}

// Soft delete - blocked once payments have been recorded, same reasoning as
// updateInvoice: a paid/partially-paid invoice is a financial record that
// needs to stay visible for reconciliation. Cancel it instead if it should
// no longer count as active business; a Draft/Sent invoice with no
// payments can be deleted freely.
export async function deleteInvoice(companyId: string, invoiceId: string) {
  const existing = await findByIdAndCompany(invoiceId, companyId);

  if (!existing) {
    throw new AppError("Invoice not found", 404);
  }

  if (Number(existing.amountPaid) > 0) {
    throw new AppError("An invoice with recorded payments cannot be deleted. Cancel it instead.", 422);
  }

  const result = await softDeleteInvoiceRow(invoiceId, companyId);

  if (result.count === 0) {
    throw new AppError("Invoice not found", 404);
  }
}

export async function restoreInvoice(companyId: string, invoiceId: string) {
  const result = await restoreInvoiceRow(invoiceId, companyId);

  if (result.count === 0) {
    throw new AppError("Deleted invoice not found", 404);
  }

  return findByIdAndCompany(invoiceId, companyId);
}
