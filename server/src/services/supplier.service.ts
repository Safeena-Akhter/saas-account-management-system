import {
  countExpensesForSupplier,
  createSupplier as createSupplierRow,
  deleteSupplier as deleteSupplierRow,
  findByIdAndCompany,
  findManyByCompany,
  findRecentExpensesForSupplier,
  sumExpensesForSupplier,
  updateSupplier as updateSupplierRow
} from "../repositories/supplier.repository";
import {
  countForCompany as countPaymentsForCompany,
  findRecentPaymentsForSupplier,
  sumPaymentsForSupplier
} from "../repositories/payment.repository";
import { AppError } from "../utils/AppError";
import { enforceLimit } from "./planLimit.service";
import type { CreateSupplierInput, ListSuppliersQuery, UpdateSupplierInput } from "../validators/supplier.validator";

export async function listSuppliers(companyId: string, query: ListSuppliersQuery) {
  const { search, isActive, sortBy, sortOrder, page, pageSize } = query;

  const { suppliers, total } = await findManyByCompany({
    companyId,
    search,
    isActive,
    sortBy,
    sortOrder,
    page,
    pageSize
  });

  return {
    suppliers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

export async function createSupplier(companyId: string, input: CreateSupplierInput) {
  // Plan.maxSuppliers.
  await enforceLimit(companyId, "suppliers");

  return createSupplierRow(companyId, input);
}

export async function updateSupplier(companyId: string, supplierId: string, input: UpdateSupplierInput) {
  const result = await updateSupplierRow(supplierId, companyId, input);

  if (result.count === 0) {
    throw new AppError("Supplier not found", 404);
  }

  return findByIdAndCompany(supplierId, companyId);
}

export async function activateSupplier(companyId: string, supplierId: string) {
  return updateSupplier(companyId, supplierId, { isActive: true });
}

export async function deactivateSupplier(companyId: string, supplierId: string) {
  return updateSupplier(companyId, supplierId, { isActive: false });
}

export async function deleteSupplier(companyId: string, supplierId: string) {
  const supplier = await findByIdAndCompany(supplierId, companyId);

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  // A supplier with expenses against them can't be hard-deleted - same
  // guard pattern customer.service.ts uses for Customer -> Invoice/Payment,
  // and category.service.ts uses for Category -> Product. Deactivating is
  // the intended way to retire a supplier without touching expense history.
  const expenseCount = await countExpensesForSupplier(supplierId, companyId);

  if (expenseCount > 0) {
    throw new AppError(
      `Cannot delete a supplier with ${expenseCount} expense(s) on record. Deactivate them instead.`,
      409
    );
  }

  await deleteSupplierRow(supplierId, companyId);
}

// Powers the Supplier Details page: contact info + purchasing snapshot
// (opening balance, purchase/payment counts, recent activity). Recent
// expenses are capped at 5, matching dashboard.repository.ts's
// recentActivities cap and customer.service.ts's recent invoices/payments,
// for the same "glanceable summary, not a full ledger" reason - the full
// history is one click away on the Expenses page, filtered by this
// supplier.
export async function getSupplierDetails(companyId: string, supplierId: string) {
  const supplier = await findByIdAndCompany(supplierId, companyId);

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  const [purchaseCount, sumResult, recentExpenses, paymentCount, totalPaid, recentPayments] = await Promise.all([
    countExpensesForSupplier(supplierId, companyId),
    sumExpensesForSupplier(supplierId, companyId),
    findRecentExpensesForSupplier(supplierId, companyId),
    countPaymentsForCompany(companyId, { supplierId, type: "PAID" }),
    sumPaymentsForSupplier(supplierId, companyId),
    findRecentPaymentsForSupplier(supplierId, companyId)
  ]);

  const totalPurchased = Number(sumResult._sum.amount ?? 0);

  // Real, live-computed balance now that Supplier Payment exists (see
  // payment.service.ts#recordSupplierPayment): what's owed at onboarding,
  // minus every completed payment made against it since. Can go negative
  // (the supplier's been overpaid / is in credit) - that's shown as-is
  // rather than floored at 0, since it's meaningful information.
  // Expenses don't factor in here: per schema.prisma's comment, an Expense
  // is recorded as an already-paid transaction at the time it happens, not
  // an addition to what's owed.
  const outstandingPayable = Number(supplier.openingBalance) - totalPaid;

  // Same "merge, tag, sort" shape as customer.service.ts's activity feed,
  // scoped to this one supplier - purchases (Expense rows) and payments
  // (real Payment rows, type PAID) are now genuinely distinct events.
  const activity = [
    {
      id: `supplier-${supplier.id}`,
      type: "supplier" as const,
      label: "Supplier added",
      amount: null,
      createdAt: supplier.createdAt
    },
    ...recentExpenses.map(expense => ({
      id: `expense-${expense.id}`,
      type: "purchase" as const,
      label: `Purchase: ${expense.title}`,
      amount: Number(expense.amount),
      createdAt: expense.expenseDate
    })),
    ...recentPayments.map(payment => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      label: `Payment via ${payment.method.replace("_", " ")}`,
      amount: Number(payment.amount),
      createdAt: payment.paymentDate
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    supplier,
    stats: {
      outstandingPayable,
      openingBalance: Number(supplier.openingBalance),
      purchaseCount,
      paymentCount,
      totalPurchased,
      totalPaid
    },
    recentPurchases: recentExpenses,
    recentPayments,
    activity
  };
}
