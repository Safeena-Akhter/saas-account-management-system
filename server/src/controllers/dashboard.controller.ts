import type { NextFunction, Request, Response } from "express";

import * as dashboardService from "../services/dashboard.service";
import { AppError } from "../utils/AppError";

// One endpoint, not five - the payload shape already differs per role (see
// dashboard.service.ts), and req.user.role is trusted (came off the verified
// JWT), so there's no reason to make the client ask for a specific role's
// dashboard by name. This also means a Manager can never even request the
// Business Owner's numbers by hitting a different URL.
export async function getMyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, companyId } = req.user!;

    if (role === "SUPER_ADMIN") {
      const dashboard = await dashboardService.getSuperAdminDashboard();

      res.status(200).json({ dashboard });

      return;
    }

    if (!companyId) {
      throw new AppError("This account is not associated with a company", 403);
    }

    switch (role) {
      case "BUSINESS_OWNER": {
        const dashboard = await dashboardService.getBusinessOwnerDashboard(companyId);

        res.status(200).json({ dashboard });

        return;
      }
      case "MANAGER": {
        const dashboard = await dashboardService.getManagerDashboard(companyId);

        res.status(200).json({ dashboard });

        return;
      }
      case "ACCOUNTANT": {
        const dashboard = await dashboardService.getAccountantDashboard(companyId);

        res.status(200).json({ dashboard });

        return;
      }
      case "EMPLOYEE": {
        const dashboard = await dashboardService.getEmployeeDashboard(companyId);

        res.status(200).json({ dashboard });

        return;
      }
      default:
        throw new AppError("Unknown role", 403);
    }
  } catch (err) {
    next(err);
  }
}
