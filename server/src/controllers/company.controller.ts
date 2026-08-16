import type { NextFunction, Request, Response } from "express";

import * as companyService from "../services/company.service";

export async function getMyCompany(req: Request, res: Response, next: NextFunction) {
  try {
    // `requireCompanyScope` (mounted before this handler) already guarantees
    // `req.user!.companyId` is a non-null string here.
    const company = await companyService.getMyCompany(req.user!.companyId!);

    res.status(200).json({ company });
  } catch (err) {
    next(err);
  }
}

export async function updateMyCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companyService.updateMyCompany(req.user!.companyId!, req.body, req.user!.id);

    res.status(200).json({ company });
  } catch (err) {
    next(err);
  }
}

export async function uploadCompanyLogo(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companyService.uploadCompanyLogo(req.user!.companyId!, req.file, req.user!.id);

    res.status(200).json({ company });
  } catch (err) {
    next(err);
  }
}

// Super Admin only - see companyService.listCompaniesDirectory's comment.
export async function listDirectory(_req: Request, res: Response, next: NextFunction) {
  try {
    const companies = await companyService.listCompaniesDirectory();

    res.status(200).json({ companies });
  } catch (err) {
    next(err);
  }
}
