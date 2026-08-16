import { prisma } from "../config/db";

type SessionMeta = { userAgent?: string; ipAddress?: string };

export function storeRefreshToken(userId: string, token: string, expiresAt: Date, meta: SessionMeta = {}) {
  return prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      lastUsedAt: new Date()
    }
  });
}

export function findRefreshToken(token: string) {
  return prisma.refreshToken.findUnique({ where: { token } });
}

export function revokeRefreshToken(token: string) {
  return prisma.refreshToken.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export function revokeAllRefreshTokensForUser(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

// ---------------------------------------------------------------------------
// Active Sessions (Settings module). A "session" here is a live (not
// expired, not revoked) refresh token - the same row created at login and
// rotated on every /auth/refresh (see auth.service.ts).
// ---------------------------------------------------------------------------

export function listActiveSessionsForUser(userId: string) {
  return prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
    select: { id: true, userAgent: true, ipAddress: true, lastUsedAt: true, createdAt: true, token: true }
  });
}

// `updateMany` with a compound (id + userId) where, same reasoning as
// user.repository.ts's updateCompanyUser: makes it structurally impossible
// to revoke another user's session even if a controller ever forgot to
// pre-check ownership.
export function revokeSessionById(id: string, userId: string) {
  return prisma.refreshToken.updateMany({
    where: { id, userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}
