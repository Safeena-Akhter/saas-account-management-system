import {
  countProductsInCategory,
  createCategory as createCategoryRow,
  deleteCategory as deleteCategoryRow,
  findByIdAndCompany,
  findByIdAndCompanyWithProductCount,
  findByNameAndCompany,
  findManyByCompany,
  updateCategory as updateCategoryRow
} from "../repositories/category.repository";
import { AppError } from "../utils/AppError";
import { enforceLimit } from "./planLimit.service";
import type { CreateCategoryInput, ListCategoriesQuery, UpdateCategoryInput } from "../validators/category.validator";

// Mirrors customer.service.ts's listCustomers: builds the pagination
// envelope on top of the repository's { rows, total } shape.
export async function listCategories(companyId: string, query: ListCategoriesQuery) {
  const { search, isActive, sortBy, sortOrder, page, pageSize } = query;

  const { categories, total } = await findManyByCompany({
    companyId,
    search,
    isActive,
    sortBy,
    sortOrder,
    page,
    pageSize
  });

  return {
    categories,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

// Powers the Category Details view: the category record plus its live
// products count. Mirrors getCustomerDetails's "not found -> 404" guard.
export async function getCategoryDetails(companyId: string, categoryId: string) {
  const category = await findByIdAndCompanyWithProductCount(categoryId, companyId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const { _count, ...rest } = category;

  return {
    category: rest,
    productsCount: _count.products
  };
}

export async function createCategory(companyId: string, input: CreateCategoryInput) {
  // Plan.maxCategories.
  await enforceLimit(companyId, "categories");

  const existing = await findByNameAndCompany(input.name, companyId);

  if (existing) {
    throw new AppError("A category with this name already exists", 409);
  }

  return createCategoryRow(companyId, input);
}

export async function updateCategory(companyId: string, categoryId: string, input: UpdateCategoryInput) {
  const category = await findByIdAndCompany(categoryId, companyId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (input.name && input.name !== category.name) {
    const existing = await findByNameAndCompany(input.name, companyId);

    if (existing) {
      throw new AppError("A category with this name already exists", 409);
    }
  }

  const result = await updateCategoryRow(categoryId, companyId, input);

  if (result.count === 0) {
    throw new AppError("Category not found", 404);
  }

  return findByIdAndCompany(categoryId, companyId);
}

// Dedicated single-purpose activate/deactivate - same split as
// customer.service.ts/supplier.service.ts, so the UI can call a single-
// purpose "Activate"/"Deactivate" action against a dedicated route instead
// of a generic PATCH. Deactivating is also the intended way to retire a
// category without deleting it (see deleteCategory's guard below).
export async function activateCategory(companyId: string, categoryId: string) {
  return updateCategory(companyId, categoryId, { isActive: true });
}

export async function deactivateCategory(companyId: string, categoryId: string) {
  return updateCategory(companyId, categoryId, { isActive: false });
}

export async function deleteCategory(companyId: string, categoryId: string) {
  const category = await findByIdAndCompany(categoryId, companyId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // A Category with Products under it can't be hard-deleted - there's no
  // safe default (orphaning the products or cascading their deletion are
  // both destructive surprises). Deactivating the category is the intended
  // way to retire it without touching its products.
  const productCount = await countProductsInCategory(categoryId, companyId);

  if (productCount > 0) {
    throw new AppError(
      `Cannot delete a category with ${productCount} product(s) assigned to it. Deactivate it instead, or move the products first.`,
      409
    );
  }

  await deleteCategoryRow(categoryId, companyId);
}
