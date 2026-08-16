import type { NextFunction, Request, Response } from "express";

import * as invoiceService from "../services/invoice.service";
import type { ListInvoiceQuery } from "../validators/invoice.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as ListInvoiceQuery;
    const { invoices, pagination } = await invoiceService.listInvoices(req.user!.companyId!, query);

    res.status(200).json({ invoices, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.getInvoice(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ invoice });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.createInvoice(req.user!.companyId!, req.user!.id, req.body);

    res.status(201).json({ invoice });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.updateInvoice(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ invoice });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.updateInvoiceStatus(
      req.user!.companyId!,
      req.params.id as string,
      req.body.status,
      req.user!.id
    );

    res.status(200).json({ invoice });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await invoiceService.deleteInvoice(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function restore(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.restoreInvoice(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ invoice });
  } catch (err) {
    next(err);
  }
}
