import type { NextFunction, Request, Response } from "express";

import * as paymentService from "../services/payment.service";
import type { ListPaymentQuery } from "../validators/payment.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as ListPaymentQuery;
    const { payments, pagination } = await paymentService.listPayments(req.user!.companyId!, query);

    res.status(200).json({ payments, pagination });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.getPayment(req.user!.companyId!, req.params.id as string);

    res.status(200).json({ payment });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.recordPayment(req.user!.companyId!, req.user!.id, req.body);

    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
}

export async function createSupplierPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.recordSupplierPayment(req.user!.companyId!, req.user!.id, req.body);

    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.updatePaymentStatus(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ payment });
  } catch (err) {
    next(err);
  }
}
