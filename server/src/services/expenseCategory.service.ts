import {
  countExpensesInCategory,
  createExpenseCategory as createRow,
  deleteExpenseCategory as deleteRow,
  findByIdAndCompany,
  findByIdAndCompanyWithExpenseCount,
  findByNameAndCompany,
  findManyByCompany,
  updateExpenseCategory as updateRow
} from "../repositories/expenseCategory.repository";
import { AppError } from "../utils/AppError";
import type {
  CreateExpenseCategoryInput,
  ListExpenseCategoriesQuery,
  UpdateExpenseCategoryInput
} from "../validators/expenseCategory.validator";

// Mirrors category.service.ts throughout this file - same pagination
// envelope, same name-uniqueness guard, same "deactivate instead of
// delete" rule once anything is attached.
export async function listExpenseCategories(companyId: string, query: ListExpenseCategoriesQuery) {
  const { search, isActive, sortBy, sortOrder, page, pageSize } = query;

  const { categories, total } = await findManyByCompany({ companyId, search, isActive, sortBy, sortOrder, page, pageSize });

  return {
    categories,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  };
}

export async function getExpenseCategoryDetails(companyId: string, categoryId: string) {
  const category = await findByIdAndCompanyWithExpenseCount(categoryId, companyId);

  if (!category) {
    throw new AppError("Expense category not found", 404);
  }

  const { _count, ...rest } = category;

  return { category: rest, expensesCount: _count.expenses };
}

export async function createExpenseCategory(companyId: string, input: CreateExpenseCategoryInput) {
  const existing = await findByNameAndCompany(input.name, companyId);

  if (existing) {
    throw new AppError("An expense category with this name already exists", 409);
  }

  return createRow(companyId, input);
}

export async function updateExpenseCategory(companyId: string, categoryId: string, input: UpdateExpenseCategoryInput) {
  const category = await findByIdAndCompany(categoryId, companyId);

  if (!category) {
    throw new AppError("Expense category not found", 404);
  }

  if (input.name && input.name !== category.name) {
    const existing = await findByNameAndCompany(input.name, companyId);

    if (existing) {
      throw new AppError("An expense category with this name already exists", 409);
    }
  }

  const result = await updateRow(categoryId, companyId, input);

  if (result.count === 0) {
    throw new AppError("Expense category not found", 404);
  }

  return findByIdAndCompany(categoryId, companyId);
}

export async function activateExpenseCategory(companyId: string, categoryId: string) {
  return updateExpenseCategory(companyId, categoryId, { isActive: true });
}

export async function deactivateExpenseCategory(companyId: string, categoryId: string) {
  return updateExpenseCategory(companyId, categoryId, { isActive: false });
}

export async function deleteExpenseCategory(companyId: string, categoryId: string) {
  const category = await findByIdAndCompany(categoryId, companyId);

  if (!category) {
    throw new AppError("Expense category not found", 404);
  }

  const expenseCount = await countExpensesInCategory(categoryId, companyId);

  if (expenseCount > 0) {
    throw new AppError(
      `Cannot delete a category with ${expenseCount} expense(s) assigned to it. Deactivate it instead, or move the expenses first.`,
      409
    );
  }

  await deleteRow(categoryId, companyId);
}
