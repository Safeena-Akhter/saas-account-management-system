import { findByIdAndCompany as findCategoryByIdAndCompany } from "../repositories/category.repository";
import {
  createProduct as createProductRow,
  deleteProduct as deleteProductRow,
  findByIdAndCompany,
  findBySkuAndCompany,
  findManyByCompany,
  updateProduct as updateProductRow
} from "../repositories/product.repository";
import { AppError } from "../utils/AppError";
import { createForRoles, notifyOrIgnore } from "./notification.service";
import { enforceLimit } from "./planLimit.service";
import type { CreateProductInput, UpdateProductInput } from "../validators/product.validator";

// Matches dashboard.repository.ts's countLowStockProducts default threshold
// - kept as a local constant here (rather than importing across a
// dashboard->product dependency) since it's a small, stable business rule,
// same "duplicate a small constant instead of a cross-module import for one
// number" tradeoff already made elsewhere in this codebase.
const LOW_STOCK_THRESHOLD = 10;

// Same roles product.routes.ts already restricts create/update to
// (BUSINESS_OWNER, MANAGER) - inlined the same way rather than a new
// PRODUCT_MODULE_WRITE_ROLES constant, matching that route file's existing
// style of not extracting this particular pair.
const LOW_STOCK_NOTIFY_ROLES = ["BUSINESS_OWNER", "MANAGER"] as const;

export function listProducts(companyId: string) {
  return findManyByCompany(companyId);
}

async function assertCategoryBelongsToCompany(categoryId: string, companyId: string) {
  const category = await findCategoryByIdAndCompany(categoryId, companyId);

  if (!category) {
    // Deliberately not distinguishing "doesn't exist" from "belongs to
    // another company" - both should look identical to the caller, same
    // reasoning as every other cross-tenant lookup in this codebase.
    throw new AppError("Category not found", 400);
  }
}

export async function createProduct(companyId: string, input: CreateProductInput) {
  // Plan.maxProducts.
  await enforceLimit(companyId, "products");

  await assertCategoryBelongsToCompany(input.categoryId, companyId);

  if (input.sku) {
    const existing = await findBySkuAndCompany(input.sku, companyId);

    if (existing) {
      throw new AppError("A product with this SKU already exists", 409);
    }
  }

  const product = await createProductRow(companyId, input);

  if (product.stockQuantity <= LOW_STOCK_THRESHOLD) {
    void notifyOrIgnore(() =>
      createForRoles(companyId, [...LOW_STOCK_NOTIFY_ROLES], {
        type: "LOW_STOCK",
        title: "Low stock",
        message: `${product.name} was added with only ${product.stockQuantity} in stock.`,
        link: `/products/${product.id}`
      })
    );
  }

  return product;
}

export async function updateProduct(companyId: string, productId: string, input: UpdateProductInput) {
  const product = await findByIdAndCompany(productId, companyId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (input.categoryId) {
    await assertCategoryBelongsToCompany(input.categoryId, companyId);
  }

  if (input.sku && input.sku !== product.sku) {
    const existing = await findBySkuAndCompany(input.sku, companyId);

    if (existing) {
      throw new AppError("A product with this SKU already exists", 409);
    }
  }

  const updatedCount = await updateProductRow(productId, companyId, input);

  if (updatedCount === 0) {
    throw new AppError("Product not found", 404);
  }

  const updated = await findByIdAndCompany(productId, companyId);

  // Only notify on the crossing-into-low-stock transition (was above the
  // threshold, now at or below it) - not on every subsequent save of an
  // already-low-stock product, which would otherwise renotify on every
  // unrelated field edit (price, description, ...).
  if (
    updated &&
    typeof input.stockQuantity === "number" &&
    product.stockQuantity > LOW_STOCK_THRESHOLD &&
    updated.stockQuantity <= LOW_STOCK_THRESHOLD
  ) {
    void notifyOrIgnore(() =>
      createForRoles(companyId, [...LOW_STOCK_NOTIFY_ROLES], {
        type: "LOW_STOCK",
        title: "Low stock",
        message: `${updated.name} is running low - only ${updated.stockQuantity} left in stock.`,
        link: `/products/${updated.id}`
      })
    );
  }

  return updated;
}

export async function deleteProduct(companyId: string, productId: string) {
  const product = await findByIdAndCompany(productId, companyId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await deleteProductRow(productId, companyId);
}
