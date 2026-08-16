import { Router } from "express";

import * as notificationController from "../controllers/notification.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { validateQuery } from "../middlewares/validate.middleware";
import { listNotificationsQuerySchema } from "../validators/notification.validator";

const router = Router();

// Every authenticated company user has full access to their own
// notifications - unlike every other module in this app there's no RBAC
// split here, because a notification already belongs to exactly one user
// (see notification.repository.ts's fan-out model). SUPER_ADMIN is still
// excluded by requireCompanyScope, same as every other tenant-scoped route
// tree, since notifications are always company-scoped.
router.use(requireAuth, requireCompanyScope);

router.get("/", validateQuery(listNotificationsQuerySchema), notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/mark-all-read", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.remove);

export default router;
