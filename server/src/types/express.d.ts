import type { Role } from "@prisma/client";

// Augments Express's Request type so `req.user`, set by `auth.middleware.ts`
// once the access token is verified, is typed everywhere without every
// controller having to re-declare or cast it. Also adds `validatedQuery`,
// set by `validate.middleware.ts`'s `validateQuery` - see that file for why
// this can't just be a reassigned `req.query` under Express 5.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        companyId: string | null;
      };
      validatedQuery?: unknown;
    }
  }
}

export {};
