import {
  countIncomesInCategory,
  createIncomeCategory as createRow,
  deleteIncomeCategory as deleteRow,
  findByIdAndCompany,
  findByIdAndCompanyWithIncomeCount,
  findByNameAndCompany,
  findManyByCompany,
  updateIncomeCategory as updateRow
} from "../repositories/incomeCategory.repository";
import { AppError } from "../utils/AppError";
import type {
  CreateIncomeCategoryInput,
  ListIncomeCategoriesQuery,
  UpdateIncomeCategoryInput
} from "../validators/incomeCategory.validator";

// Mirrors category.service.ts throughout this file - same pagination
// envelope, same name-uniqueness guard, same "deactivate instead of
// delete" rule once anything is attached.
export async function listIncomeCategories(companyId: string, query: ListIncomeCategoriesQuery) {
  const { search, isActive, sortBy, sortOrder, page, pageSize } = query;

  const { categories, total } = await findManyByCompany({ companyId, search, isActive, sortBy, sortOrder, page, pageSize });

  return {
    categories,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  };
}

export async function getIncomeCategoryDetails(companyId: string, categoryId: string) {
  const category = await findByIdAndCompanyWithIncomeCount(categoryId, companyId);

  if (!category) {
    throw new AppError("Income category not found", 404);
  }

  const { _count, ...rest } = category;

  return { category: rest, incomesCount: _count.incomes };
}

export async function createIncomeCategory(companyId: string, input: CreateIncomeCategoryInput) {
  const existing = await findByNameAndCompany(input.name, companyId);

  if (existing) {
    throw new AppError("An income category with this name already exists", 409);
  }

  return createRow(companyId, input);
}

export async function updateIncomeCategory(companyId: string, categoryId: string, input: UpdateIncomeCategoryInput) {
  const category = await findByIdAndCompany(categoryId, companyId);

  if (!category) {
    throw new AppError("Income category not found", 404);
  }

  if (input.name && input.name !== category.name) {
    const existing = await findByNameAndCompany(input.name, companyId);

    if (existing) {
      throw new AppError("An income category with this name already exists", 409);
    }
  }

  const result = await updateRow(categoryId, companyId, input);

  if (result.count === 0) {
    throw new AppError("Income category not found", 404);
  }

  return findByIdAndCompany(categoryId, companyId);
}

export async function activateIncomeCategory(companyId: string, categoryId: string) {
  return updateIncomeCategory(companyId, categoryId, { isActive: true });
}

export async function deactivateIncomeCategory(companyId: string, categoryId: string) {
  return updateIncomeCategory(companyId, categoryId, { isActive: false });
}

export async function deleteIncomeCategory(companyId: string, categoryId: string) {
  const category = await findByIdAndCompany(categoryId, companyId);

  if (!category) {
    throw new AppError("Income category not found", 404);
  }

  const incomeCount = await countIncomesInCategory(categoryId, companyId);

  if (incomeCount > 0) {
    throw new AppError(
      `Cannot delete a category with ${incomeCount} income(s) assigned to it. Deactivate it instead, or move the incomes first.`,
      409
    );
  }

  await deleteRow(categoryId, companyId);
}
