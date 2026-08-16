import { cloudinary } from "../config/cloudinary";
import {
  createExpense as createExpenseRow,
  deleteExpense as deleteExpenseRow,
  findByIdAndCompany,
  findManyByCompany,
  updateExpense as updateExpenseRow,
  updateExpenseReceipt as updateExpenseReceiptRow
} from "../repositories/expense.repository";
import { findByIdAndCompany as findSupplierByIdAndCompany } from "../repositories/supplier.repository";
import { findByIdAndCompany as findExpenseCategoryByIdAndCompany } from "../repositories/expenseCategory.repository";
import { AppError } from "../utils/AppError";
import { createForRoles, notifyOrIgnore } from "./notification.service";
import { EXPENSE_MODULE_VIEW_ROLES } from "../constants/roles";
import type { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from "../validators/expense.validator";

export async function listExpenses(companyId: string, query: ListExpensesQuery) {
  const { search, supplierId, expenseCategoryId, dateFrom, dateTo, sortBy, sortOrder, page, pageSize } = query;

  const { expenses, total } = await findManyByCompany(companyId, {
    search,
    supplierId,
    expenseCategoryId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    page,
    pageSize
  });

  return {
    expenses,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  };
}

export async function getExpenseDetails(companyId: string, expenseId: string) {
  const expense = await findByIdAndCompany(expenseId, companyId);

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  return expense;
}

async function assertSupplierBelongsToCompany(supplierId: string, companyId: string) {
  const supplier = await findSupplierByIdAndCompany(supplierId, companyId);

  if (!supplier) {
    throw new AppError("Supplier not found", 400);
  }
}

// If an expenseCategoryId was provided, resolves it to that category's name
// and returns both - the free-text `category` field always mirrors the
// linked category's name, so old code/reports reading `expense.category`
// as a plain string keep working whether or not the new picker was used.
async function resolveCategory(
  companyId: string,
  expenseCategoryId: string | null | undefined
): Promise<Partial<Pick<CreateExpenseInput, "category" | "expenseCategoryId">>> {
  if (expenseCategoryId === undefined) {
    return {};
  }

  if (expenseCategoryId === null) {
    return { expenseCategoryId: null };
  }

  const category = await findExpenseCategoryByIdAndCompany(expenseCategoryId, companyId);

  if (!category) {
    throw new AppError("Expense category not found", 400);
  }

  return { expenseCategoryId, category: category.name };
}

export async function createExpense(companyId: string, createdByUserId: string | null, input: CreateExpenseInput) {
  if (input.supplierId) {
    await assertSupplierBelongsToCompany(input.supplierId, companyId);
  }

  const categoryOverride = await resolveCategory(companyId, input.expenseCategoryId);

  const expense = await createExpenseRow(companyId, createdByUserId, { ...input, ...categoryOverride });

  // Fire-and-forget, same pattern as invoice/payment notifications - Owner,
  // Manager (financial visibility), Accountant (the roles that can see
  // company financials per EXPENSE_MODULE_VIEW_ROLES), never the actor who
  // just recorded it.
  void notifyOrIgnore(() =>
    createForRoles(
      companyId,
      EXPENSE_MODULE_VIEW_ROLES,
      {
        type: "EXPENSE_ADDED",
        title: "Expense added",
        message: `A new expense "${expense.title}" of ${expense.amount} was recorded.`,
        link: `/expenses/${expense.id}`
      },
      createdByUserId ?? undefined
    )
  );

  return expense;
}

export async function updateExpense(companyId: string, expenseId: string, input: UpdateExpenseInput) {
  const existing = await findByIdAndCompany(expenseId, companyId);

  if (!existing) {
    throw new AppError("Expense not found", 404);
  }

  if (input.supplierId) {
    await assertSupplierBelongsToCompany(input.supplierId, companyId);
  }

  const categoryOverride = await resolveCategory(companyId, input.expenseCategoryId);

  const result = await updateExpenseRow(expenseId, companyId, { ...input, ...categoryOverride });

  if (result.count === 0) {
    throw new AppError("Expense not found", 404);
  }

  return findByIdAndCompany(expenseId, companyId);
}

export async function deleteExpense(companyId: string, expenseId: string) {
  const existing = await findByIdAndCompany(expenseId, companyId);

  if (!existing) {
    throw new AppError("Expense not found", 404);
  }

  await deleteExpenseRow(expenseId, companyId);
}

// Streams the buffer multer parsed into memory straight to Cloudinary, same
// pattern as company.service.ts's uploadCompanyLogo - the file never
// touches this server's disk. public_id is the expense's own id (not the
// companyId, unlike the logo) since a company can have many receipts;
// folder is still companyId-scoped for tenant-clean storage organization.
function uploadBufferToCloudinary(buffer: Buffer, companyId: string, expenseId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `ams/expense-receipts/${companyId}`,
        public_id: expenseId,
        overwrite: true,
        resource_type: "auto" // receipts can be an image or a PDF - "auto" lets Cloudinary detect which
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export async function uploadExpenseReceipt(companyId: string, expenseId: string, file?: Express.Multer.File) {
  const existing = await findByIdAndCompany(expenseId, companyId);

  if (!existing) {
    throw new AppError("Expense not found", 404);
  }

  if (!file) {
    throw new AppError("No receipt file was uploaded", 422);
  }

  let receiptUrl: string;

  try {
    receiptUrl = await uploadBufferToCloudinary(file.buffer, companyId, expenseId);
  } catch {
    throw new AppError("Could not upload receipt, please try again", 502);
  }

  await updateExpenseReceiptRow(expenseId, companyId, receiptUrl);

  return findByIdAndCompany(expenseId, companyId);
}
