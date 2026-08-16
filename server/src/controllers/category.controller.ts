import type { NextFunction, Request, Response } from "express";

import * as categoryService from "../services/category.service";
import type { ListCategoriesQuery } from "../validators/category.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Set by validateQuery(listCategoriesQuerySchema) in category.routes.ts -
    // already parsed, coerced, and defaulted. Not read from req.query
    // directly: see validate.middleware.ts for why.
    const query = req.validatedQuery as ListCategoriesQuery;
    const { categories, pagination } = await categoryService.listCategories(req.user!.companyId!, query);

    res.status(200).json({ categories, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const details = await categoryService.getCategoryDetails(req.user!.companyId!, req.params.id as string);

    res.status(200).json(details);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.createCategory(req.user!.companyId!, req.body);

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.updateCategory(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.activateCategory(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.deactivateCategory(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
