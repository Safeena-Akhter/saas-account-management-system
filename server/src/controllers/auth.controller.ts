import type { NextFunction, Request, Response } from "express";

import * as authService from "../services/auth.service";
import * as userService from "../services/user.service";
import * as emailVerificationService from "../services/emailVerification.service";
import { isProduction } from "../config/env";
import { AppError } from "../utils/AppError";

// Refresh tokens are set as an httpOnly cookie so client-side JS (and any
// XSS) can never read it directly - only the access token lives in the
// NextAuth session on the frontend.
const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/api/v1/auth"
};

// Best-effort device fingerprint captured at login/refresh time, purely for
// the Active Sessions settings screen's display ("Chrome on Windows") - see
// the comment on RefreshToken.userAgent in schema.prisma for why this is
// informational only, not a security control.
function sessionMetaFromRequest(req: Request) {
  const userAgent = req.headers["user-agent"];

  return {
    userAgent: typeof userAgent === "string" ? userAgent.slice(0, 255) : undefined,
    ipAddress: req.ip
  };
}


export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);

    // No refresh cookie, no access/refresh token in the body - see the
    // comment in auth.service.ts's register(). The account exists but has
    // no session until the verification link is clicked.
    res.status(201).json({
      user: result.user,
      message: "Account created. Check your email to verify your account before logging in."
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.token;

    if (typeof token !== "string" || token.length === 0) {
      throw new AppError("Missing verification token", 400);
    }

    await emailVerificationService.verifyEmail(token);

    res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resendVerificationEmail(req.body.email);

    // Always the same response whether or not the email exists / is already
    // verified - same user-enumeration reasoning as login's generic error.
    res.status(200).json({ message: "If that email needs verifying, we've sent a new link." });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body, sessionMetaFromRequest(req));

    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;

    if (!token) {
      throw new AppError("No refresh token provided", 401);
    }

    const result = await authService.refresh(token, sessionMetaFromRequest(req));

    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;

    await authService.logout(token);

    res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.me(req.user!.id);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.forgotPassword(req.body.email);

    // Same enumeration-safe generic response regardless of whether the
    // email exists / is verified - see resendVerification above.
    res.status(200).json({ message: "If that email is registered, we've sent a password reset link." });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resetPassword(req.body);

    res.status(200).json({ message: "Password reset successfully. Please log in with your new password." });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.changePassword(req.user!.id, req.body);

    res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Settings module: Profile, Preferences, Active Sessions. All self-service -
// every handler below acts on req.user!.id (the authenticated caller), never
// a route param, so there's no id to spoof.
// ---------------------------------------------------------------------------

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateMyProfile(req.user!.id, req.body);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateMyAvatar(req.user!.id, req.file);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateMyPreferences(req.user!.id, req.body);

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const currentToken = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    const sessions = await authService.listMySessions(req.user!.id, currentToken);

    res.status(200).json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.revokeMySession(req.user!.id, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function logoutAllSessions(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logoutAllSessions(req.user!.id);

    res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ message: "Logged out of all devices." });
  } catch (err) {
    next(err);
  }
}
