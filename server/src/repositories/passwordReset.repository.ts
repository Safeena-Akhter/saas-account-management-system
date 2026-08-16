import { prisma } from "../config/db";

export function createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
  return prisma.passwordResetToken.create({
    data: { userId, token, expiresAt }
  });
}

export function findPasswordResetToken(token: string) {
  return prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });
}

export function deletePasswordResetToken(token: string) {
  return prisma.passwordResetToken.deleteMany({
    where: { token }
  });
}

// Invalidates any previously-issued reset links whenever a new one is
// requested, or once a reset actually succeeds - same "one live token at a
// time" invariant used by the email-verification flow.
export function deletePasswordResetTokensForUser(userId: string) {
  return prisma.passwordResetToken.deleteMany({
    where: { userId }
  });
}
