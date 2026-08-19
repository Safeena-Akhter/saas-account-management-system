import type { NextFunction, Request, Response } from "express";

import * as platformUserService from "../services/platformUser.service";
import type { ListPlatformUsersQuery } from "../validators/platformUser.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as ListPlatformUsersQuery;
    const { users, pagination } = await platformUserService.listUsers(query);

    res.status(200).json({ users, pagination });
  } catch (err) {
    next(err);
  }
}

export async function details(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await platformUserService.getUserDetails(req.params.id as string);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await platformUserService.activateUser(req.params.id as string);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await platformUserService.deactivateUser(req.params.id as string);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
