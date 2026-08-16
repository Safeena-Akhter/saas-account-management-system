import type { NextFunction, Request, Response } from "express";

import * as invitationService from "../services/invitation.service";

export async function validate(req: Request, res: Response, next: NextFunction) {
  try {
    const invitation = await invitationService.validateInvitationToken(req.params.token as string);

    res.status(200).json({ invitation });
  } catch (err) {
    next(err);
  }
}

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    await invitationService.acceptInvitation(req.params.token as string, req.body);

    res.status(200).json({ message: "Your password has been set. You can now log in." });
  } catch (err) {
    next(err);
  }
}
