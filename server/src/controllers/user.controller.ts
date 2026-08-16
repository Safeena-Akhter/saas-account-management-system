import type { NextFunction, Request, Response } from "express";

import * as userService from "../services/user.service";
import type { ListUsersQuery } from "../validators/user.validator";

// Every handler below builds `actor` from `req.user` (verified JWT claims)
// rather than trusting anything in the request body/params for who is
// performing the action. `companyId!` is safe because `requireCompanyScope`
// runs before every route in user.routes.ts.
function actorFrom(req: Request) {
  return { id: req.user!.id, role: req.user!.role, companyId: req.user!.companyId! };
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Set by validateQuery(listUsersQuerySchema) in user.routes.ts - already
    // parsed, coerced (string -> number), and defaulted. Not read from
    // req.query directly: see validate.middleware.ts for why.
    const query = req.validatedQuery as ListUsersQuery;
    const { users, pagination } = await userService.listCompanyUsers(actorFrom(req), query);

    res.status(200).json({ users, pagination });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.createCompanyUser(actorFrom(req), req.body);

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateCompanyUser(actorFrom(req), req.params.id as string, req.body);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.activateCompanyUser(actorFrom(req), req.params.id as string);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.deactivateCompanyUser(actorFrom(req), req.params.id as string);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.deleteCompanyUser(actorFrom(req), req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function resendInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.resendInvitation(actorFrom(req), req.params.id as string);

    res.status(200).json({ user, message: "Invitation resent." });
  } catch (err) {
    next(err);
  }
}
