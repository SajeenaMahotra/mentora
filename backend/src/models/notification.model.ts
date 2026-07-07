import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "booking_requested"
  | "booking_accepted"
  | "booking_declined"
  | "booking_cancelled"
  | "payment_confirmed"
  | "booking_completed"
  | "dispute_raised"
  | "dispute_resolved";

export type NotificationRelatedType = "Booking" | "Dispute" | "Payment";

export interface INotification extends Document {
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link?: string; // e.g. /bookings/:id
  relatedType?: NotificationRelatedType;
  relatedId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "booking_requested",
        "booking_accepted",
        "booking_declined",
        "booking_cancelled",
        "payment_confirmed",
        "booking_completed",
        "dispute_raised",
        "dispute_resolved",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    relatedType: { type: String, enum: ["Booking", "Dispute", "Payment"] },
    relatedId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Supports both "recent notifications for user" and "unread count for user" queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default model<INotification>("Notification", notificationSchema);