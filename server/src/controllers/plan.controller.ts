import type { NextFunction, Request, Response } from "express";

import * as planService from "../services/plan.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await planService.listPlans();

    res.status(200).json({ plans });
  } catch (err) {
    next(err);
  }
}

// GET /plans/active - the pricing/upgrade screen every non-Super-Admin
// role uses. Kept as its own route+controller function rather than a query
// param on GET / (e.g. ?active=true) since these are two genuinely
// different audiences with different RBAC (see plan.routes.ts): the full
// list is Super-Admin-only, this one is any authenticated user.
export async function listActive(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await planService.listActivePlans();

    res.status(200).json({ plans });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await planService.createPlan(req.body);

    res.status(201).json({ plan });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await planService.updatePlan(req.params.id as string, req.body);

    res.status(200).json({ plan });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await planService.activatePlan(req.params.id as string);

    res.status(200).json({ plan });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await planService.deactivatePlan(req.params.id as string);

    res.status(200).json({ plan });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await planService.deletePlan(req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
