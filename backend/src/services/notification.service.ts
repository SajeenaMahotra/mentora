import { Types } from "mongoose";
import { notificationRepository } from "../repositories/notification.repository";
import { NotificationType, NotificationRelatedType } from "../models/notification.model";
import { getIO, personalRoom } from "../sockets/io.instance";
import logger from "../config/logger";
import { userRepository } from "../repositories/user.repository";

interface CreateNotificationInput {
  recipient: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  relatedType?: NotificationRelatedType;
  relatedId?: Types.ObjectId | string;
}

export const notificationService = {
  // Writes the notification, then emits it live over the recipient's
  // personal room. The emit is best-effort: if a socket error happens,
  // the notification still exists in the DB and will show up next time
  // the user polls/loads the bell — same reasoning as audit log wrapping.
  async create(input: CreateNotificationInput) {
    const notification = await notificationRepository.create(input);

    try {
      const io = getIO();
      io.to(personalRoom(input.recipient.toString())).emit("notification_created", {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        body: notification.body,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch (err) {
      logger.error("Failed to emit notification_created", { err, recipient: input.recipient });
    }

    return notification;
  },

  async getForUser(userId: string, options: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    return notificationRepository.findAllForUser(userId, options);
  },

  async getUnreadCount(userId: string) {
    return notificationRepository.countUnread(userId);
  },

  async markAsRead(id: string, userId: string) {
    return notificationRepository.markAsRead(id, userId);
  },

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  },


  // --- Fans a security event out to every admin as a real-time notification.
// Used for account lockouts and IP blocks — the two events that represent
// an active brute-force attack in progress, per assignment scope.
async alertAdmins(input: Omit<CreateNotificationInput, "recipient">) {
  const admins = await userRepository.findAllAdminIds();
  await Promise.all(
    admins.map((admin: any) =>
      this.create({ ...input, recipient: admin._id.toString() }).catch((err) => {
        logger.error("Failed to alert admin", { err, adminId: admin._id });
      })
    )
  );
},
};