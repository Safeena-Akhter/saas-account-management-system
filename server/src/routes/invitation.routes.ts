import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as invitationController from "../controllers/invitation.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { acceptInvitationSchema } from "../validators/invitation.validator";

const router = Router();

// Both endpoints are public (no auth - the token itself is the credential,
// same as email verification / password reset), so they get the same
// brute-force protection: 20 attempts per 15 minutes per IP.
const invitationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

router.get("/:token", invitationRateLimit, invitationController.validate);
router.post("/:token/accept", invitationRateLimit, validateBody(acceptInvitationSchema), invitationController.accept);

export default router;
