import type { NotificationType, Role } from "@prisma/client";

import {
  countUnreadForUser,
  createManyNotifications,
  createNotification,
  deleteNotification as deleteNotificationRow,
  findActiveUserIdsByCompanyAndRoles,
  findByIdAndUser,
  findManyForUser,
  markAllAsRead as markAllAsReadRow,
  markAsRead as markAsReadRow
} from "../repositories/notification.repository";
import { AppError } from "../utils/AppError";
import type { ListNotificationsQuery } from "../validators/notification.validator";

// ---------------------------------------------------------------------------
// Read side - powers the Notification Center / bell dropdown. Every
// function here takes companyId + userId and is called from
// notification.controller.ts with both drawn from the authenticated
// request, same "trust the verified JWT claims, not anything from the
// route/body" pattern as every other module's actorFrom().
// ---------------------------------------------------------------------------

export async function listNotifications(companyId: string, userId: string, query: ListNotificationsQuery) {
  const { isRead, type, page, pageSize } = query;

  const { notifications, total } = await findManyForUser({ companyId, userId, isRead, type, page, pageSize });

  return {
    notifications,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

export async function getUnreadCount(companyId: string, userId: string) {
  const count = await countUnreadForUser(companyId, userId);

  return { count };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const existing = await findByIdAndUser(notificationId, userId);

  if (!existing) {
    throw new AppError("Notification not found", 404);
  }

  await markAsReadRow(notificationId, userId);

  return findByIdAndUser(notificationId, userId);
}

export async function markAllNotificationsAsRead(companyId: string, userId: string) {
  await markAllAsReadRow(companyId, userId);
}

export async function deleteNotification(userId: string, notificationId: string) {
  const existing = await findByIdAndUser(notificationId, userId);

  if (!existing) {
    throw new AppError("Notification not found", 404);
  }

  await deleteNotificationRow(notificationId, userId);
}

// ---------------------------------------------------------------------------
// Write side - called from other modules' services (invoice, payment,
// expense, product, user, company, subscription) right after the triggering
// action succeeds. Every function here is deliberately fire-and-forget from
// the caller's point of view: see notifyOrIgnore below - a failure to write
// a notification must never fail (or roll back) the business action that
// triggered it.
//
// Real-time-ready: these are the only functions in the codebase that create
// a Notification row. When realtime is added, a socket/SSE emit is a single
// addition inside createForUser/createForUsers below (using the row(s) they
// already return) - no call site elsewhere needs to change.
// ---------------------------------------------------------------------------

type NotifyInput = {
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
};

export function createForUser(companyId: string, userId: string, input: NotifyInput) {
  return createNotification({ companyId, userId, ...input });
}

export async function createForUsers(companyId: string, userIds: string[], input: NotifyInput) {
  const uniqueUserIds = [...new Set(userIds)];

  await createManyNotifications(uniqueUserIds.map(userId => ({ companyId, userId, ...input })));
}

// Fans out to every active user in the company whose role is in `roles` -
// e.g. Business Owners and Managers, for "New User Invitation". Excludes
// `excludeUserId` when given, so the actor who performed the action doesn't
// also get notified about their own action.
export async function createForRoles(
  companyId: string,
  roles: Role[],
  input: NotifyInput,
  excludeUserId?: string
) {
  const users = await findActiveUserIdsByCompanyAndRoles(companyId, roles);
  const userIds = users.map(u => u.id).filter(id => id !== excludeUserId);

  await createForUsers(companyId, userIds, input);
}

// Broadcasts to every active user in the company regardless of role - e.g.
// "Company Updated". Same excludeUserId behavior as createForRoles.
export async function createForCompany(companyId: string, input: NotifyInput, excludeUserId?: string) {
  const users = await findActiveUserIdsByCompanyAndRoles(companyId);
  const userIds = users.map(u => u.id).filter(id => id !== excludeUserId);

  await createForUsers(companyId, userIds, input);
}

// Wraps any of the createFor* calls above so a notification-delivery
// failure (a bug in this module, a DB hiccup) is logged and swallowed
// rather than propagating into the caller's request - e.g. an invoice must
// still be created successfully even if notifying about it fails. Every
// call site in other services' code should go through this, not call
// createForUser/createForUsers/createForRoles/createForCompany directly.
export async function notifyOrIgnore(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Notification delivery failed:", err);
  }
}
