import type { NextFunction, Request, Response } from "express";

import * as productService from "../services/product.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await productService.listProducts(req.user!.companyId!);

    res.status(200).json({ products });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.createProduct(req.user!.companyId!, req.body);

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.updateProduct(req.user!.companyId!, req.params.id as string, req.body);

    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteProduct(req.user!.companyId!, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
