import type { NextFunction, Request, Response } from "express";

import * as customerService from "../services/customer.service";
import type { ListCustomersQuery } from "../validators/customer.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Set by validateQuery(listCustomersQuerySchema) in customer.routes.ts -
    // already parsed, coerced, and defaulted. Not read from req.query
    // directly: see validate.middleware.ts for why.
    const query = req.validatedQuery as ListCustomersQuery;
    const { customers, pagination } = await customerService.listCustomers(req.user!.companyId!, query);

    res.status(200).json({ customers, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const details = await customerService.getCustomerDetails(req.user!.companyId!, req.params.id as string);

    res.status(200).json(details);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.createCustomer(req.user!.companyId!, req.body);

    res.status(201).json({ customer });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.updateCustomer(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ customer });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.activateCustomer(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ customer });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.deactivateCustomer(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ customer });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await customerService.deleteCustomer(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
