import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { uploadAvatar } from "../middlewares/upload.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema
} from "../validators/auth.validator";
import { updatePreferencesSchema, updateProfileSchema } from "../validators/user.validator";

const router = Router();

// Brute-force protection on the credential-checking endpoints specifically
// (not the whole API) - 20 attempts per 15 minutes per IP.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

// Tighter limit than login/register - resend is a mechanism for repeatedly
// triggering outbound email, so it needs its own (stricter) ceiling to
// prevent it being used to spam an inbox.
const resendVerificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

// Same reasoning as resendVerificationRateLimit: a public, unauthenticated
// endpoint that triggers outbound email needs its own tight ceiling so it
// can't be used to spam an inbox or brute-force-probe which emails exist.
const forgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

router.get("/verify-email", authController.verifyEmail);
router.post(
  "/resend-verification",
  resendVerificationRateLimit,
  validateBody(resendVerificationSchema),
  authController.resendVerification
);
router.post("/register", authRateLimit, validateBody(registerSchema), authController.register);
router.post("/login", authRateLimit, validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

router.post(
  "/forgot-password",
  forgotPasswordRateLimit,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post("/reset-password", authRateLimit, validateBody(resetPasswordSchema), authController.resetPassword);
router.post(
  "/change-password",
  requireAuth,
  authRateLimit,
  validateBody(changePasswordSchema),
  authController.changePassword
);

// ---------------------------------------------------------------------------
// Settings module: Profile, Preferences, Active Sessions. requireAuth only
// (no requireCompanyScope) - SUPER_ADMIN has no companyId but still needs
// to manage their own profile, preferences, and sessions like every other
// user.
// ---------------------------------------------------------------------------

router.patch("/me", requireAuth, validateBody(updateProfileSchema), authController.updateProfile);
router.post("/me/avatar", requireAuth, uploadAvatar, authController.uploadAvatar);
router.patch("/me/preferences", requireAuth, validateBody(updatePreferencesSchema), authController.updatePreferences);

router.get("/sessions", requireAuth, authController.listSessions);
router.delete("/sessions/:id", requireAuth, authController.revokeSession);
router.post("/logout-all", requireAuth, authController.logoutAllSessions);

export default router;
