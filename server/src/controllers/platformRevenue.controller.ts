import type { NextFunction, Request, Response } from "express";

import * as platformRevenueService from "../services/platformRevenue.service";

export async function overview(_req: Request, res: Response, next: NextFunction) {
  try {
    const revenue = await platformRevenueService.getRevenueOverview();

    res.status(200).json({ revenue });
  } catch (err) {
    next(err);
  }
}
