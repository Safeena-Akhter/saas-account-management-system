import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";

const includeDefault = {
  customer: { select: { id: true, name: true, email: true } },
  items: true,
  payments: { orderBy: { paymentDate: "desc" as const } }
};

// Soft delete - every read that powers a user-facing list/detail/aggregate
// excludes deleted invoices by default. Callers that genuinely need a
// deleted row (e.g. the restore flow) pass their own `where.deletedAt`
// override, which takes precedence since it's spread after this base.
const notDeleted = { deletedAt: null } as const;

export type InvoiceSortBy = "issueDate" | "dueDate" | "invoiceNumber" | "totalAmount" | "status";

export type ListInvoicesOptions = {
  where?: Prisma.InvoiceWhereInput;
  search?: string;
  sortBy?: InvoiceSortBy;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

function buildWhere(companyId: string, options: ListInvoicesOptions = {}): Prisma.InvoiceWhereInput {
  const { where = {}, search } = options;

  return {
    companyId,
    ...notDeleted,
    ...where,
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search } },
            { customer: { name: { contains: search } } },
            { notes: { contains: search } }
          ]
        }
      : {})
  };
}

export function findManyByCompany(companyId: string, options: ListInvoicesOptions = {}) {
  const { sortBy = "issueDate", sortOrder = "desc", page = 1, pageSize = 200 } = options;

  return prisma.invoice.findMany({
    where: buildWhere(companyId, options),
    include: includeDefault,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize
  });
}

export function countMatching(companyId: string, options: ListInvoicesOptions = {}) {
  return prisma.invoice.count({ where: buildWhere(companyId, options) });
}

export function findByIdAndCompany(id: string, companyId: string, options: { includeDeleted?: boolean } = {}) {
  return prisma.invoice.findFirst({
    where: { id, companyId, ...(options.includeDeleted ? {} : notDeleted) },
    include: includeDefault
  });
}

export function countForCompany(companyId: string, where: Prisma.InvoiceWhereInput = {}) {
  return prisma.invoice.count({ where: { companyId, ...notDeleted, ...where } });
}

// Highest invoiceNumber suffix for this company this calendar year, used to
// generate the next sequential invoice number (see invoice.service.ts).
// Deliberately counts ALL invoices, deleted included - the
// (companyId, invoiceNumber) unique constraint still applies to
// soft-deleted rows, so a deleted invoice's number must stay reserved to
// avoid a collision when the next one is minted.
export function countInvoicesForCompany(companyId: string) {
  return prisma.invoice.count({ where: { companyId } });
}

export function createInvoice(
  companyId: string,
  data: Omit<Prisma.InvoiceCreateInput, "company" | "customer" | "createdBy" | "items"> & {
    customerId: string;
    createdByUserId?: string | null;
    items: Prisma.InvoiceItemCreateWithoutInvoiceInput[];
  }
) {
  const { customerId, createdByUserId, items, ...rest } = data;

  return prisma.invoice.create({
    data: {
      ...rest,
      company: { connect: { id: companyId } },
      customer: { connect: { id: customerId } },
      ...(createdByUserId ? { createdBy: { connect: { id: createdByUserId } } } : {}),
      items: { create: items }
    },
    include: includeDefault
  });
}

// Full edit: replaces the invoice's scalar fields and, when `items` is
// provided, wholesale-replaces its line items (delete-all + recreate,
// inside a transaction so a partial write can never leave an invoice with
// no items). companyId is re-asserted in the updateMany-style guard via the
// service layer's existence check before this ever runs.
export function updateInvoice(
  id: string,
  data: Partial<
    Pick<
      Prisma.InvoiceUncheckedUpdateInput,
      "customerId" | "issueDate" | "dueDate" | "subtotal" | "taxAmount" | "discountAmount" | "totalAmount" | "notes"
    >
  > & { items?: Prisma.InvoiceItemCreateWithoutInvoiceInput[] }
) {
  const { items, ...rest } = data;

  return prisma.$transaction(async tx => {
    if (items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    }

    return tx.invoice.update({
      where: { id },
      data: {
        ...rest,
        ...(items ? { items: { create: items } } : {})
      },
      include: includeDefault
    });
  });
}

export function updateInvoiceStatus(id: string, companyId: string, status: Prisma.InvoiceUpdateInput["status"]) {
  return prisma.invoice.updateMany({ where: { id, companyId, ...notDeleted }, data: { status } });
}

// Soft delete - stamps deletedAt rather than removing the row, so the
// invoice (and its items/payments, for accounting history) survive. Scoped
// by companyId + notDeleted so it's a no-op (count 0) against another
// tenant's invoice or one that's already deleted.
export function softDeleteInvoice(id: string, companyId: string) {
  return prisma.invoice.updateMany({ where: { id, companyId, ...notDeleted }, data: { deletedAt: new Date() } });
}

// Restore a soft-deleted invoice. Scoped to rows that ARE currently
// deleted, so restoring twice is a no-op (count 0) rather than clobbering
// an active invoice's deletedAt.
export function restoreInvoice(id: string, companyId: string) {
  return prisma.invoice.updateMany({
    where: { id, companyId, NOT: { deletedAt: null } },
    data: { deletedAt: null }
  });
}

// Recomputes amountPaid from the linked payments and derives a status from
// it. Called by payment.service.ts after a payment is created or removed so
// invoices never drift out of sync with their payment history.
export async function recomputeAmountPaid(id: string, companyId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId, ...notDeleted },
    // Only COMPLETED payments have actually cleared - a PENDING payment
    // logged against this invoice (see payment.service.ts's status-aware
    // recordPayment) hasn't moved money yet and shouldn't count toward
    // amountPaid; a FAILED/CANCELLED one never will. type: "RECEIVED" is
    // belt-and-suspenders (a PAID/supplier payment is never linked to an
    // invoiceId in the first place, see payment.validator.ts).
    include: { payments: { where: { status: "COMPLETED", type: "RECEIVED" } } }
  });

  if (!invoice) return null;

  const amountPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const total = Number(invoice.totalAmount);

  let status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED" = invoice.status;

  if (invoice.status !== "CANCELLED" && invoice.status !== "DRAFT") {
    if (amountPaid <= 0) {
      status = new Date(invoice.dueDate) < new Date() ? "OVERDUE" : "SENT";
    } else if (amountPaid >= total) {
      status = "PAID";
    } else {
      status = "PARTIALLY_PAID";
    }
  }

  return prisma.invoice.update({
    where: { id },
    data: { amountPaid, status },
    include: includeDefault
  });
}

export function sumOutstanding(companyId: string) {
  return prisma.invoice.aggregate({
    where: { companyId, ...notDeleted, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
    _sum: { totalAmount: true, amountPaid: true }
  });
}
