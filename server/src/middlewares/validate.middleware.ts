import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { AppError } from "../utils/AppError";

// Wraps a Zod schema into Express middleware. On success, `req.body` is
// replaced with the parsed (and coerced/trimmed/lower-cased, per the schema)
// value, so downstream handlers can trust its shape.
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues.map(issue => issue.message).join(", ");

      return next(new AppError(message, 422));
    }

    req.body = result.data;
    next();
  };
}

// Same idea as validateBody, but for req.query (e.g. GET /users?search=..&page=..).
// Unlike req.body, req.query cannot be reassigned under Express 5 - it's a
// getter-only property now (assigning to it throws "Cannot set property
// query of #<IncomingMessage> which has only a getter"). So instead of
// overwriting req.query, the parsed/coerced/defaulted result is attached to
// req.validatedQuery (see types/express.d.ts) - controllers read from there,
// not from req.query, whenever a route uses this middleware.
export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues.map(issue => issue.message).join(", ");

      return next(new AppError(message, 422));
    }

    req.validatedQuery = result.data;
    next();
  };
}
