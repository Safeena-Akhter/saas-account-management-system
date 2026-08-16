import crypto from "crypto";

import type { Role } from "@prisma/client";

import { env } from "../config/env";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email.service";
import {
  findRefreshToken,
  listActiveSessionsForUser,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  revokeSessionById,
  storeRefreshToken
} from "../repositories/refreshToken.repository";
import {
  createEmailVerificationToken,
  deleteTokens
} from "../repositories/emailVerification.repository";
import {
  createPasswordResetToken,
  deletePasswordResetToken,
  deletePasswordResetTokensForUser,
  findPasswordResetToken
} from "../repositories/passwordReset.repository";
import {
  createCompanyWithOwner,
  findUserByEmail,
  findUserById,
  updatePassword
} from "../repositories/user.repository";
import { assignFreePlanToNewCompany } from "./subscription.service";
import { AppError } from "../utils/AppError";
import { durationFromNow } from "../utils/duration";
import { comparePassword, hashPassword } from "../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { getPermissionsForRole } from "../constants/permissions";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput
} from "../validators/auth.validator";

// Reset links are shorter-lived than email verification links (1h vs 24h) -
// a forgotten password is time-sensitive and the request is user-initiated,
// so there's no benefit to a longer window the way there is for
// "verify whenever you get around to checking your inbox".
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

// Shape returned to the frontend after register/login/refresh. Never
// includes the password hash. Exported so user.service.ts's self-service
// profile/avatar/preferences updates return the exact same shape - the
// frontend session syncs from whichever endpoint was just called, so a
// second, slightly-different mapper would risk drifting out of sync.
export function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
  company: { id: string; name: string; logoUrl: string | null; currency: string } | null;
  phone?: string | null;
  avatarUrl?: string | null;
  theme?: string;
  language?: string;
  dateFormat?: string;
  currencyFormat?: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    // `currency` is included here (not just in the /company/settings
    // response) specifically so every page that displays a money amount
    // can read it straight from the session instead of each independently
    // fetching the company or - as every real financial view was doing
    // before this - hardcoding "USD". See client's
    // hooks/useCurrencyFormatter.ts.
    company: user.company
      ? { id: user.company.id, name: user.company.name, logoUrl: user.company.logoUrl, currency: user.company.currency }
      : null,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    preferences: {
      theme: user.theme ?? "system",
      language: user.language ?? "en",
      dateFormat: user.dateFormat ?? "DD/MM/YYYY",
      // Display STYLE only ("PKR 2,000.00" vs "2,000.00Rs") - never a
      // different currency than the company's. See
      // validators/user.validator.ts's updatePreferencesSchema for why this
      // reverted from a currency-code enum back to a two-value style toggle.
      currencyFormat: user.currencyFormat ?? "symbol"
    },
    // Derived, not stored - always the live definition in constants/permissions.ts,
    // so there's no risk of a stale permission set surviving a role-rule change.
    permissions: getPermissionsForRole(user.role)
  };
}

type SessionMeta = { userAgent?: string; ipAddress?: string };

async function issueTokenPair(user: { id: string; role: Role; companyId: string | null }, meta: SessionMeta = {}) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, companyId: user.companyId });
  const refreshToken = signRefreshToken({ sub: user.id });

  await storeRefreshToken(user.id, refreshToken, durationFromNow(env.JWT_REFRESH_EXPIRES_IN), meta);

  return { accessToken, refreshToken };
}
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function register(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);

  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await createCompanyWithOwner({
    name: input.name,
    email: input.email,
    hashedPassword,
    companyName: input.companyName
  });

  // Every company must have an active subscription (planLimit.service.ts's
  // enforceLimit fails closed without one) - auto-assign the Free plan
  // right away rather than leaving the company unsubscribed until a Super
  // Admin happens to assign one. Best-effort: a missing/renamed Free plan
  // shouldn't block registration itself, see assignFreePlanToNewCompany's
  // own comment.
  if (user.companyId) {
    await assignFreePlanToNewCompany(user.companyId);
  }

  const verificationToken = generateVerificationToken();

  // Clear out any stale tokens for this email first (there shouldn't be
  // any for a brand-new user, but this keeps register() and
  // resendVerificationEmail() sharing the same "one live token at a time"
  // invariant).
  await deleteTokens(user.email);
  await createEmailVerificationToken(user.id, user.email, verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000));
  await sendVerificationEmail(user.email, user.name, verificationToken);

  // Deliberately NOT issuing an access/refresh token pair here. Doing so
  // would hand a brand-new, unverified account a fully working session -
  // silently bypassing the exact restriction login() enforces below
  // (emailVerifiedAt must be set). The account exists, but nothing about it
  // is usable yet until the link in the verification email is clicked.
  return { user: toPublicUser(user) };
}

export async function resendVerificationEmail(email: string) {
  const user = await findUserByEmail(email);

  // Same-response-either-way at the controller level handles the
  // user-enumeration concern; this just quietly does nothing for the cases
  // where sending would be wrong or pointless.
  if (!user || user.emailVerifiedAt) {
    return;
  }

  const verificationToken = generateVerificationToken();

  await deleteTokens(user.email);
  await createEmailVerificationToken(user.id, user.email, verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000));
  await sendVerificationEmail(user.email, user.name, verificationToken);
}

export async function login(input: LoginInput, meta: SessionMeta = {}) {
  const user = await findUserByEmail(input.email);

  // Same error for "no such user" and "wrong password" - don't leak which
  // one it was, that's a user-enumeration vector.
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been deactivated. Contact your administrator.", 403);
  }

  if (!user.emailVerifiedAt) {
    throw new AppError("Please verify your email first.", 403);
  }

  if (user.company && !user.company.isActive) {
    throw new AppError("This company's account has been suspended. Contact support.", 403);
  }

  const passwordMatches = await comparePassword(input.password, user.password);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const tokens = await issueTokenPair(user, meta);

  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string, meta: SessionMeta = {}) {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const stored = await findRefreshToken(refreshToken);

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError("Refresh token has been revoked or expired", 401);
  }

  const user = await findUserById(payload.sub);

  if (!user || !user.isActive) {
    throw new AppError("Account no longer active", 401);
  }

  // Rotate: revoke the used refresh token and issue a brand-new pair. This
  // means a stolen-and-replayed refresh token stops working the moment the
  // legitimate client refreshes again.
  await revokeRefreshToken(refreshToken);
  const tokens = await issueTokenPair(user, meta);

  return { user: toPublicUser(user), ...tokens };
}

export async function logout(refreshToken: string | undefined) {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
}

export async function logoutAllSessions(userId: string) {
  await revokeAllRefreshTokensForUser(userId);
}

// ---------------------------------------------------------------------------
// Active Sessions (Settings module). `currentRefreshToken` is the raw token
// value read from the caller's own httpOnly cookie (see auth.controller.ts)
// - it's used only to flag which row is "this device" in the response, and
// is never itself included in what gets sent back. The raw `token` column
// is intentionally stripped from every session in the response: returning
// a live refresh token value over the API - even the caller's own - would
// hand the frontend (and anything that can read its network traffic/logs) a
// credential that can impersonate that session, which defeats the point of
// keeping it in an httpOnly cookie in the first place.
// ---------------------------------------------------------------------------

export async function listMySessions(userId: string, currentRefreshToken?: string) {
  const sessions = await listActiveSessionsForUser(userId);

  return sessions.map(({ token, ...session }) => ({
    ...session,
    isCurrent: token === currentRefreshToken
  }));
}

export async function revokeMySession(userId: string, sessionId: string) {
  const result = await revokeSessionById(sessionId, userId);

  if (result.count === 0) {
    throw new AppError("Session not found", 404);
  }
}

export async function me(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toPublicUser(user);
}

export async function forgotPassword(email: string) {
  const user = await findUserByEmail(email);

  // Same "always looks like success" shape as resendVerificationEmail -
  // the controller returns an identical generic message either way, this
  // just quietly no-ops for accounts that shouldn't get a reset link
  // (doesn't exist, or was created but never verified - resetting a
  // password on an account you can't even log into yet isn't useful and
  // would itself leak whether the email is registered).
  if (!user || !user.emailVerifiedAt) {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");

  await deletePasswordResetTokensForUser(user.id);
  await createPasswordResetToken(user.id, token, new Date(Date.now() + PASSWORD_RESET_TTL_MS));
  await sendPasswordResetEmail(user.email, user.name, token);
}

export async function resetPassword(input: ResetPasswordInput) {
  const record = await findPasswordResetToken(input.token);

  if (!record) {
    throw new AppError("Invalid or expired reset link.", 400);
  }

  if (record.expiresAt < new Date()) {
    // Clean up the dead token instead of leaving it around for the next
    // lookup to also reject - keeps the table from silently accumulating
    // expired rows forever.
    await deletePasswordResetToken(input.token);
    throw new AppError("Invalid or expired reset link.", 400);
  }

  const hashedPassword = await hashPassword(input.password);

  await updatePassword(record.userId, hashedPassword);
  await deletePasswordResetTokensForUser(record.userId);

  // A password reset is a strong signal the previous password may have
  // been compromised (that's usually *why* someone resets it) - every
  // existing session is force-logged-out so a stolen refresh token issued
  // under the old password stops working immediately.
  await revokeAllRefreshTokensForUser(record.userId);
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const currentMatches = await comparePassword(input.currentPassword, user.password);

  if (!currentMatches) {
    throw new AppError("Current password is incorrect", 401);
  }

  const hashedPassword = await hashPassword(input.newPassword);

  await updatePassword(user.id, hashedPassword);

  // Unlike resetPassword, deliberately NOT revoking every session here -
  // the caller just proved they hold the current session's valid access
  // token *and* the current password, so this session in particular can
  // stay logged in. (If "log out other devices on password change" is
  // wanted later, call logoutAllSessions(userId) separately from the
  // controller and keep this service function's contract unchanged.)
}
