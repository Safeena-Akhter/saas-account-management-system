import {
  countInvoicesForCustomer,
  countPaymentsForCustomer,
  createCustomer as createCustomerRow,
  deleteCustomer as deleteCustomerRow,
  findByIdAndCompany,
  findManyByCompany,
  findRecentInvoicesForCustomer,
  findRecentPaymentsForCustomer,
  sumOutstandingForCustomer,
  updateCustomer as updateCustomerRow
} from "../repositories/customer.repository";
import { countForCompany as countPaymentsForCompany } from "../repositories/payment.repository";
import { AppError } from "../utils/AppError";
import { enforceLimit } from "./planLimit.service";
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from "../validators/customer.validator";

export async function listCustomers(companyId: string, query: ListCustomersQuery) {
  const { search, isActive, sortBy, sortOrder, page, pageSize } = query;

  const { customers, total } = await findManyByCompany({
    companyId,
    search,
    isActive,
    sortBy,
    sortOrder,
    page,
    pageSize
  });

  return {
    customers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

export async function createCustomer(companyId: string, input: CreateCustomerInput) {
  // Plan.maxCustomers.
  await enforceLimit(companyId, "customers");

  return createCustomerRow(companyId, input);
}

export async function updateCustomer(companyId: string, customerId: string, input: UpdateCustomerInput) {
  const result = await updateCustomerRow(customerId, companyId, input);

  if (result.count === 0) {
    throw new AppError("Customer not found", 404);
  }

  return findByIdAndCompany(customerId, companyId);
}

export async function activateCustomer(companyId: string, customerId: string) {
  return updateCustomer(companyId, customerId, { isActive: true });
}

export async function deactivateCustomer(companyId: string, customerId: string) {
  return updateCustomer(companyId, customerId, { isActive: false });
}

export async function deleteCustomer(companyId: string, customerId: string) {
  const customer = await findByIdAndCompany(customerId, companyId);

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  // A customer with invoices or payments against them can't be hard-deleted
  // - there's no safe default (orphaning those records or cascading their
  // deletion are both destructive surprises), and the Invoice/Payment
  // relations aren't cascading anyway, so this would otherwise fail as an
  // unhandled foreign-key error. Deactivating is the intended way to retire
  // a customer without touching their billing history - same guard pattern
  // category.service.ts already uses for Category -> Product.
  const [invoiceCount, paymentCount] = await Promise.all([
    countInvoicesForCustomer(customerId, companyId),
    countPaymentsForCustomer(customerId, companyId)
  ]);

  if (invoiceCount > 0 || paymentCount > 0) {
    const parts = [
      invoiceCount > 0 ? `${invoiceCount} invoice(s)` : null,
      paymentCount > 0 ? `${paymentCount} payment(s)` : null
    ].filter(Boolean);

    throw new AppError(`Cannot delete a customer with ${parts.join(" and ")} on record. Deactivate them instead.`, 409);
  }

  await deleteCustomerRow(customerId, companyId);
}

// Powers the Customer Details page: contact info + billing snapshot
// (outstanding balance, invoice/payment counts, recent activity). Recent
// invoices/payments are capped at 5 each, matching dashboard.repository.ts's
// recentActivities cap for the same "glanceable summary, not a full ledger"
// reason - the full history is one click away on the Invoices/Payments
// pages, filtered by this customer.
export async function getCustomerDetails(companyId: string, customerId: string) {
  const customer = await findByIdAndCompany(customerId, companyId);

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const [invoiceCount, paymentCount, outstanding, recentInvoices, recentPayments] = await Promise.all([
    countInvoicesForCustomer(customerId, companyId),
    countPaymentsForCompany(companyId, { customerId }),
    sumOutstandingForCustomer(customerId, companyId),
    findRecentInvoicesForCustomer(customerId, companyId),
    findRecentPaymentsForCustomer(customerId, companyId)
  ]);

  const outstandingBalance =
    Number(outstanding._sum.totalAmount ?? 0) - Number(outstanding._sum.amountPaid ?? 0);

  // Same "merge, tag, sort" shape as dashboard.repository.ts's
  // recentActivities, scoped to this one customer instead of the whole
  // company.
  const activity = [
    {
      id: `customer-${customer.id}`,
      type: "customer" as const,
      label: "Customer added",
      amount: null,
      createdAt: customer.createdAt
    },
    ...recentInvoices.map(invoice => ({
      id: `invoice-${invoice.id}`,
      type: "invoice" as const,
      label: `Invoice ${invoice.invoiceNumber} (${invoice.status})`,
      amount: Number(invoice.totalAmount),
      createdAt: invoice.issueDate
    })),
    ...recentPayments.map(payment => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      label: payment.invoice ? `Payment received for ${payment.invoice.invoiceNumber}` : "Payment received",
      amount: Number(payment.amount),
      createdAt: payment.paymentDate
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    customer,
    stats: {
      outstandingBalance,
      creditLimit: Number(customer.creditLimit),
      invoiceCount,
      paymentCount
    },
    recentInvoices,
    recentPayments,
    activity
  };
}
