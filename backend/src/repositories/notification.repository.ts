import { Types } from "mongoose";
import NotificationModel, {
  INotification,
  NotificationType,
  NotificationRelatedType,
} from "../models/notification.model";

interface CreateNotificationInput {
  recipient: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  relatedType?: NotificationRelatedType;
  relatedId?: Types.ObjectId | string;
}

interface FindAllForUserOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

interface PaginatedNotifications {
  notifications: INotification[];
  total: number;
  page: number;
  totalPages: number;
}

export const notificationRepository = {
  async create(data: CreateNotificationInput): Promise<INotification> {
    return NotificationModel.create(data);
  },

  async findAllForUser(
    userId: Types.ObjectId | string,
    options: FindAllForUserOptions = {}
  ): Promise<PaginatedNotifications> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { recipient: userId };
    if (options.unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(filter),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async countUnread(userId: Types.ObjectId | string): Promise<number> {
    return NotificationModel.countDocuments({ recipient: userId, isRead: false });
  },

  // IDOR protection: recipient is included directly in the query filter, not just
  // checked after the fact — a notification ID belonging to another user simply
  // won't match, so findOneAndUpdate returns null instead of updating someone else's data.
  async markAsRead(
    id: Types.ObjectId | string,
    userId: Types.ObjectId | string
  ): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );
  },

  async markAllAsRead(userId: Types.ObjectId | string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount;
  },
};