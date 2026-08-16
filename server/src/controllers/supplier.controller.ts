import type { NextFunction, Request, Response } from "express";

import * as supplierService from "../services/supplier.service";
import type { ListSuppliersQuery } from "../validators/supplier.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Set by validateQuery(listSuppliersQuerySchema) in supplier.routes.ts -
    // already parsed, coerced, and defaulted. See customer.controller.ts's
    // identical comment for why this isn't read from req.query directly.
    const query = req.validatedQuery as ListSuppliersQuery;
    const { suppliers, pagination } = await supplierService.listSuppliers(req.user!.companyId!, query);

    res.status(200).json({ suppliers, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const details = await supplierService.getSupplierDetails(req.user!.companyId!, req.params.id as string);

    res.status(200).json(details);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.createSupplier(req.user!.companyId!, req.body);

    res.status(201).json({ supplier });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.updateSupplier(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ supplier });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.activateSupplier(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ supplier });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.deactivateSupplier(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ supplier });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await supplierService.deleteSupplier(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
