import { prisma } from "../config/db";

export function createInvitationToken(userId: string, token: string, expiresAt: Date) {
  return prisma.invitationToken.create({
    data: { userId, token, expiresAt }
  });
}

export function findInvitationToken(token: string) {
  return prisma.invitationToken.findUnique({
    where: { token },
    include: { user: { include: { company: true } } }
  });
}

export function deleteInvitationToken(token: string) {
  return prisma.invitationToken.deleteMany({
    where: { token }
  });
}

// Invalidates any previously-issued invite links for this user - used both
// before issuing a fresh one (create/resend) and after acceptance, so a
// token can never be reused and there's only ever one live invite per user.
export function deleteInvitationTokensForUser(userId: string) {
  return prisma.invitationToken.deleteMany({
    where: { userId }
  });
}
