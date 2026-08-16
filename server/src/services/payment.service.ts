import {
  createPayment as createPaymentRow,
  findByIdAndCompany,
  findManyByCompany,
  updatePaymentStatus as updatePaymentStatusRow
} from "../repositories/payment.repository";
import { findByIdAndCompany as findInvoiceByIdAndCompany, recomputeAmountPaid } from "../repositories/invoice.repository";
import { findByIdAndCompany as findSupplierByIdAndCompany } from "../repositories/supplier.repository";
import { AppError } from "../utils/AppError";
import { createForRoles, notifyOrIgnore } from "./notification.service";
import { INVOICE_MODULE_WRITE_ROLES } from "../constants/roles";
import type {
  CreatePaymentInput,
  CreateSupplierPaymentInput,
  ListPaymentQuery,
  UpdatePaymentStatusInput
} from "../validators/payment.validator";

export async function listPayments(companyId: string, query: ListPaymentQuery) {
  const options = {
    where: {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            paymentDate: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {})
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

  const { payments, total } = await findManyByCompany(companyId, options);

  return {
    payments,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize))
    }
  };
}

export async function getPayment(companyId: string, paymentId: string) {
  const payment = await findByIdAndCompany(paymentId, companyId);

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  return payment;
}

// Receive Customer Payment - unchanged behavior for the COMPLETED case
// (every caller before Payment.status existed gets exactly what it always
// got). The new PENDING path skips the invoice recompute entirely: the
// money hasn't cleared, so Invoice.amountPaid shouldn't move yet. See
// updatePaymentStatus below for what happens when a PENDING payment is
// later confirmed.
export async function recordPayment(companyId: string, createdByUserId: string | null, input: CreatePaymentInput) {
  let customerId = input.customerId ?? null;

  // Captured here (before the payment is recorded) so the post-recompute
  // notification check below can tell "just became PAID" apart from
  // "already was PAID" without a second lookup.
  let previousInvoiceStatus: string | undefined;

  if (input.invoiceId) {
    const invoice = await findInvoiceByIdAndCompany(input.invoiceId, companyId);

    if (!invoice) {
      throw new AppError("Invoice not found", 400);
    }

    if (invoice.status === "CANCELLED") {
      throw new AppError("Cannot record a payment against a cancelled invoice", 422);
    }

    const outstanding = Number(invoice.totalAmount) - Number(invoice.amountPaid);

    if (input.status === "COMPLETED" && input.amount > outstanding + 0.01) {
      throw new AppError(`Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}`, 422);
    }

    // Payments recorded against an invoice inherit its customer, so the
    // dashboard's "revenue per customer" queries stay accurate even if the
    // caller didn't pass customerId explicitly.
    customerId = customerId ?? invoice.customerId;
    previousInvoiceStatus = invoice.status;
  }

  const payment = await createPaymentRow(companyId, {
    amount: input.amount,
    method: input.method,
    type: "RECEIVED",
    status: input.status,
    paymentDate: input.paymentDate ?? new Date(),
    reference: input.reference ?? null,
    notes: input.notes ?? null,
    invoiceId: input.invoiceId ?? null,
    customerId,
    createdByUserId
  });

  if (input.invoiceId && input.status === "COMPLETED") {
    const updatedInvoice = await recomputeAmountPaid(input.invoiceId, companyId);

    if (updatedInvoice && previousInvoiceStatus !== "PAID" && updatedInvoice.status === "PAID") {
      void notifyOrIgnore(() =>
        createForRoles(
          companyId,
          INVOICE_MODULE_WRITE_ROLES,
          {
            type: "INVOICE_PAID",
            title: "Invoice paid",
            message: `Invoice ${updatedInvoice.invoiceNumber} for ${updatedInvoice.customer.name} is now fully paid.`,
            link: `/invoices/${updatedInvoice.id}`
          },
          createdByUserId ?? undefined
        )
      );
    }
  }

  if (input.status === "COMPLETED") {
    void notifyOrIgnore(() =>
      createForRoles(
        companyId,
        INVOICE_MODULE_WRITE_ROLES,
        {
          type: "PAYMENT_RECEIVED",
          title: "Payment received",
          message: `A payment of ${payment.amount} was received${input.invoiceId ? " against an invoice" : ""}.`,
          link: input.invoiceId ? `/invoices/${input.invoiceId}` : undefined
        },
        createdByUserId ?? undefined
      )
    );
  }

  return payment;
}

// Supplier Payment - money paid out, paying down what the company owes
// this supplier. Never touches Invoice.amountPaid (suppliers have no
// invoice-equivalent here) - supplier.service.ts's getSupplierDetails is
// what turns these into a live outstandingPayable figure.
export async function recordSupplierPayment(
  companyId: string,
  createdByUserId: string | null,
  input: CreateSupplierPaymentInput
) {
  const supplier = await findSupplierByIdAndCompany(input.supplierId, companyId);

  if (!supplier) {
    throw new AppError("Supplier not found", 400);
  }

  return createPaymentRow(companyId, {
    amount: input.amount,
    method: input.method,
    type: "PAID",
    status: input.status,
    paymentDate: input.paymentDate ?? new Date(),
    reference: input.reference ?? null,
    notes: input.notes ?? null,
    supplierId: input.supplierId,
    createdByUserId
  });
}

// Transitions a payment's status (e.g. a PENDING cheque clears -> COMPLETED,
// or bounces -> FAILED). Only a RECEIVED payment linked to an invoice needs
// any follow-up: entering COMPLETED means money that wasn't counted before
// now should be, and leaving COMPLETED (a correction - marking a
// previously-completed payment FAILED/CANCELLED) means money that was
// counted no longer should be. Either way, recomputeAmountPaid re-derives
// amountPaid from scratch from every currently-COMPLETED payment, so it's
// always correct regardless of which transition happened.
export async function updatePaymentStatus(companyId: string, paymentId: string, input: UpdatePaymentStatusInput) {
  const existing = await findByIdAndCompany(paymentId, companyId);

  if (!existing) {
    throw new AppError("Payment not found", 404);
  }

  if (existing.status === input.status) {
    return existing;
  }

  const result = await updatePaymentStatusRow(paymentId, companyId, input.status);

  if (result.count === 0) {
    throw new AppError("Payment not found", 404);
  }

  if (existing.type === "RECEIVED" && existing.invoiceId && (existing.status === "COMPLETED" || input.status === "COMPLETED")) {
    await recomputeAmountPaid(existing.invoiceId, companyId);
  }

  return findByIdAndCompany(paymentId, companyId);
}
