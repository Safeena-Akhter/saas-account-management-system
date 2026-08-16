import { deleteVerificationToken, findVerificationToken } from "../repositories/emailVerification.repository";
import { markEmailVerified } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";

export async function verifyEmail(token: string) {
  const verification = await findVerificationToken(token);

  if (!verification) {
    throw new AppError("Invalid verification link.", 400);
  }

  if (verification.expiresAt < new Date()) {
    throw new AppError("Verification link expired.", 400);
  }

  await markEmailVerified(verification.userId);
  await deleteVerificationToken(token);

  return verification.user;
}
