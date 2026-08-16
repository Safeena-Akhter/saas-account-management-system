import type { NotificationType, Role } from "@prisma/client";

import { prisma } from "../config/db";

type ListParams = {
  companyId: string;
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  page: number;
  pageSize: number;
};

// Mirrors category.repository.ts's findManyByCompany shape (where-then-
// Promise.all(findMany, count)) so every list endpoint in the app stays
// consistent. Always scoped by both userId AND companyId - userId alone
// would already be tenant-safe (a notification's userId can only ever
// belong to one company), but the extra companyId check is cheap
// defense-in-depth, same reasoning as every other tenant-scoped repository
// here.
export async function findManyForUser({ companyId, userId, isRead, type, page, pageSize }: ListParams) {
  const where = {
    companyId,
    userId,
    ...(typeof isRead === "boolean" ? { isRead } : {}),
    ...(type ? { type } : {})
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.notification.count({ where })
  ]);

  return { notifications, total };
}

export function countUnreadForUser(companyId: string, userId: string) {
  return prisma.notification.count({ where: { companyId, userId, isRead: false } });
}

export function findByIdAndUser(id: string, userId: string) {
  return prisma.notification.findFirst({ where: { id, userId } });
}

type CreateNotificationInput = {
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
};

export function createNotification(data: CreateNotificationInput) {
  return prisma.notification.create({ data });
}

// Fan-out insert for role-based/broadcast events - one row per targeted
// user, created in a single round trip. createMany can't return the created
// rows (a MySQL/Prisma limitation), which is fine here: nothing currently
// needs the ids of a broadcast batch immediately after creating it.
export function createManyNotifications(rows: CreateNotificationInput[]) {
  if (rows.length === 0) {
    return Promise.resolve({ count: 0 });
  }

  return prisma.notification.createMany({ data: rows });
}

// Resolves which users a role-based notification should fan out to -
// active users only (a deactivated user shouldn't accumulate notifications
// they'll never see), optionally narrowed to a specific set of roles.
export function findActiveUserIdsByCompanyAndRoles(companyId: string, roles?: Role[]) {
  return prisma.user.findMany({
    where: {
      companyId,
      isActive: true,
      ...(roles && roles.length > 0 ? { role: { in: roles } } : {})
    },
    select: { id: true }
  });
}

// `updateMany` (not `update`) so the compound where (id + userId) makes it
// structurally impossible to mark another user's notification as read, same
// pattern as user.repository.ts's updateCompanyUser.
export function markAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });
}

export function markAllAsRead(companyId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { companyId, userId, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });
}

export function deleteNotification(id: string, userId: string) {
  return prisma.notification.deleteMany({ where: { id, userId } });
}
