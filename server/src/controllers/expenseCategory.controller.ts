import type { NextFunction, Request, Response } from "express";

import * as service from "../services/expenseCategory.service";
import type { ListExpenseCategoriesQuery } from "../validators/expenseCategory.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as ListExpenseCategoriesQuery;
    const { categories, pagination } = await service.listExpenseCategories(req.user!.companyId!, query);

    res.status(200).json({ categories, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const details = await service.getExpenseCategoryDetails(req.user!.companyId!, req.params.id as string);

    res.status(200).json(details);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.createExpenseCategory(req.user!.companyId!, req.body);

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.updateExpenseCategory(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.activateExpenseCategory(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.deactivateExpenseCategory(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteExpenseCategory(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
