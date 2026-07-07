import { Request, Response, NextFunction } from "express";
import { listNotificationsQuerySchema } from "../dtos/notification.dto";
import { notificationService } from "../services/notification.service";

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listNotificationsQuerySchema.parse(req.query);
      const data = await notificationService.getForUser(req.user!.id, query);
      res.status(200).json({ success: true, message: "Notifications retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      res.status(200).json({ success: true, message: "Unread count retrieved", data: { count } });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notificationId = req.params.id as string;
      const data = await notificationService.markAsRead(notificationId, req.user!.id);
      res.status(200).json({ success: true, message: "Notification marked as read", data });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const modifiedCount = await notificationService.markAllAsRead(req.user!.id);
      res.status(200).json({ success: true, message: "All notifications marked as read", data: { modifiedCount } });
    } catch (err) {
      next(err);
    }
  },
};