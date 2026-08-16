import type { NextFunction, Request, Response } from "express";

import * as expenseService from "../services/expense.service";
import type { ListExpensesQuery } from "../validators/expense.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as ListExpensesQuery;
    const { expenses, pagination } = await expenseService.listExpenses(req.user!.companyId!, query);

    res.status(200).json({ expenses, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await expenseService.getExpenseDetails(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ expense });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await expenseService.createExpense(req.user!.companyId!, req.user!.id, req.body);

    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await expenseService.updateExpense(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ expense });
  } catch (err) {
    next(err);
  }
}

export async function uploadReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await expenseService.uploadExpenseReceipt(req.user!.companyId!, req.params.id as string, req.file);

    res.status(200).json({ expense });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await expenseService.deleteExpense(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
