import type { NextFunction, Request, Response } from "express";

import * as platformCompanyService from "../services/platformCompany.service";
import type { ListPlatformCompaniesQuery, ListPlatformCompanyUsersQuery } from "../validators/platformCompany.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as ListPlatformCompaniesQuery;
    const { companies, pagination } = await platformCompanyService.listCompanies(query);

    res.status(200).json({ companies, pagination });
  } catch (err) {
    next(err);
  }
}

export async function details(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await platformCompanyService.getCompanyDetails(req.params.id as string);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as ListPlatformCompanyUsersQuery;
    const { users, pagination } = await platformCompanyService.listCompanyUsers(req.params.id as string, query);

    res.status(200).json({ users, pagination });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await platformCompanyService.updateCompany(req.params.id as string, req.body);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function suspend(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await platformCompanyService.suspendCompany(req.params.id as string);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await platformCompanyService.activateCompany(req.params.id as string);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await platformCompanyService.deleteCompany(req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
