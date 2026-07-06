import { Schema, model, Document, Types } from "mongoose";

export type SessionType = "online" | "in-person" | "hybrid";
export type BookingStatus = "pending" | "accepted" | "declined" | "cancelled" | "paid" | "completed" | "disputed" | "refunded";

export interface IBooking extends Document {
  learner: Types.ObjectId;
  mentor: Types.ObjectId;
  package: Types.ObjectId;

  packageTitle: string;
  packagePrice: number;
  sessionType: SessionType;

  status: BookingStatus;
  respondedAt?: Date;

  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: Date;

  completedAt?: Date;
  disputeDeadline?: Date;

  disputeReason?: string;
  disputedAt?: Date;

  refundedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    learner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    package: { type: Schema.Types.ObjectId, ref: "Package", required: true },

    packageTitle: { type: String, required: true, trim: true, maxlength: 150 },
    packagePrice: { type: Number, required: true, min: 0 },
    sessionType: { type: String, enum: ["online", "in-person", "hybrid"], required: true },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "paid", "completed", "disputed", "refunded"],
      default: "pending",
      index: true,
    },
    respondedAt: { type: Date },
    completedAt: { type: Date },
    disputeDeadline: { type: Date },
    disputeReason: { type: String, maxlength: 1000 },
    disputedAt: { type: Date },
    refundedAt: { type: Date },

    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ learner: 1, status: 1 });
bookingSchema.index({ mentor: 1, status: 1 });

export default model<IBooking>("Booking", bookingSchema);