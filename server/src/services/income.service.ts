import {
  createIncome as createIncomeRow,
  deleteIncome as deleteIncomeRow,
  findByIdAndCompany,
  findManyByCompany,
  updateIncome as updateIncomeRow
} from "../repositories/income.repository";
import { findByIdAndCompany as findCustomerByIdAndCompany } from "../repositories/customer.repository";
import { findByIdAndCompany as findIncomeCategoryByIdAndCompany } from "../repositories/incomeCategory.repository";
import { AppError } from "../utils/AppError";
import type { CreateIncomeInput, ListIncomesQuery, UpdateIncomeInput } from "../validators/income.validator";

export async function listIncomes(companyId: string, query: ListIncomesQuery) {
  const { search, customerId, incomeCategoryId, dateFrom, dateTo, sortBy, sortOrder, page, pageSize } = query;

  const { incomes, total } = await findManyByCompany(companyId, {
    search,
    customerId,
    incomeCategoryId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    page,
    pageSize
  });

  return {
    incomes,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  };
}

export async function getIncomeDetails(companyId: string, incomeId: string) {
  const income = await findByIdAndCompany(incomeId, companyId);

  if (!income) {
    throw new AppError("Income not found", 404);
  }

  return income;
}

async function assertCustomerBelongsToCompany(customerId: string, companyId: string) {
  const customer = await findCustomerByIdAndCompany(customerId, companyId);

  if (!customer) {
    throw new AppError("Customer not found", 400);
  }
}

// Same "resolve the picked category to its name, keep the free-text field
// in sync" approach as expense.service.ts#resolveCategory.
async function resolveCategory(
  companyId: string,
  incomeCategoryId: string | null | undefined
): Promise<Partial<Pick<CreateIncomeInput, "category" | "incomeCategoryId">>> {
  if (incomeCategoryId === undefined) {
    return {};
  }

  if (incomeCategoryId === null) {
    return { incomeCategoryId: null };
  }

  const category = await findIncomeCategoryByIdAndCompany(incomeCategoryId, companyId);

  if (!category) {
    throw new AppError("Income category not found", 400);
  }

  return { incomeCategoryId, category: category.name };
}

export async function createIncome(companyId: string, createdByUserId: string | null, input: CreateIncomeInput) {
  if (input.customerId) {
    await assertCustomerBelongsToCompany(input.customerId, companyId);
  }

  const categoryOverride = await resolveCategory(companyId, input.incomeCategoryId);

  return createIncomeRow(companyId, createdByUserId, { ...input, ...categoryOverride });
}

export async function updateIncome(companyId: string, incomeId: string, input: UpdateIncomeInput) {
  const existing = await findByIdAndCompany(incomeId, companyId);

  if (!existing) {
    throw new AppError("Income not found", 404);
  }

  if (input.customerId) {
    await assertCustomerBelongsToCompany(input.customerId, companyId);
  }

  const categoryOverride = await resolveCategory(companyId, input.incomeCategoryId);

  const result = await updateIncomeRow(incomeId, companyId, { ...input, ...categoryOverride });

  if (result.count === 0) {
    throw new AppError("Income not found", 404);
  }

  return findByIdAndCompany(incomeId, companyId);
}

export async function deleteIncome(companyId: string, incomeId: string) {
  const existing = await findByIdAndCompany(incomeId, companyId);

  if (!existing) {
    throw new AppError("Income not found", 404);
  }

  await deleteIncomeRow(incomeId, companyId);
}
