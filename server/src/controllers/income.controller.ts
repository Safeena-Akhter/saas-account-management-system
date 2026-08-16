import type { NextFunction, Request, Response } from "express";

import * as incomeService from "../services/income.service";
import type { ListIncomesQuery } from "../validators/income.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as ListIncomesQuery;
    const { incomes, pagination } = await incomeService.listIncomes(req.user!.companyId!, query);

    res.status(200).json({ incomes, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const income = await incomeService.getIncomeDetails(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ income });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const income = await incomeService.createIncome(req.user!.companyId!, req.user!.id, req.body);

    res.status(201).json({ income });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const income = await incomeService.updateIncome(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ income });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await incomeService.deleteIncome(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
