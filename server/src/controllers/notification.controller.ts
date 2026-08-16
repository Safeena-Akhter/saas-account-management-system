import type { NextFunction, Request, Response } from "express";

import * as notificationService from "../services/notification.service";
import type { ListNotificationsQuery } from "../validators/notification.validator";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Set by validateQuery(listNotificationsQuerySchema) in
    // notification.routes.ts - see validate.middleware.ts for why
    // controllers read from req.validatedQuery, not req.query, here.
    const query = req.validatedQuery as ListNotificationsQuery;
    const { notifications, pagination } = await notificationService.listNotifications(
      req.user!.companyId!,
      req.user!.id,
      query
    );

    res.status(200).json({ notifications, pagination });
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const { count } = await notificationService.getUnreadCount(req.user!.companyId!, req.user!.id);

    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.markNotificationAsRead(req.user!.id, req.params.id as string);

    res.status(200).json({ notification });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllNotificationsAsRead(req.user!.companyId!, req.user!.id);

    res.status(200).json({ message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.deleteNotification(req.user!.id, req.params.id as string);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
