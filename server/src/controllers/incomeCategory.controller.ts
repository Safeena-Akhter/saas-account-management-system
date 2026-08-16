import type { NextFunction, Request, Response } from "express";

import * as service from "../services/incomeCategory.service";
import type { ListIncomeCategoriesQuery } from "../validators/incomeCategory.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as ListIncomeCategoriesQuery;
    const { categories, pagination } = await service.listIncomeCategories(req.user!.companyId!, query);

    res.status(200).json({ categories, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const details = await service.getIncomeCategoryDetails(req.user!.companyId!, req.params.id as string);

    res.status(200).json(details);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.createIncomeCategory(req.user!.companyId!, req.body);

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.updateIncomeCategory(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.activateIncomeCategory(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.deactivateIncomeCategory(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteIncomeCategory(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
