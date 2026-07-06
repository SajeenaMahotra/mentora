import { Schema, model, Document, Types } from "mongoose";

export type SessionType = "online" | "in-person" | "hybrid";
export type BookingStatus = "pending" | "accepted" | "declined" | "cancelled" | "paid" | "completed" | "disputed";

export interface IBooking extends Document {
  learner: Types.ObjectId; // ref User
  mentor: Types.ObjectId; // ref User
  package: Types.ObjectId; // ref Package

  // snapshot at booking time (package can change/be deleted later)
  packageTitle: string;
  packagePrice: number;
  sessionType: SessionType;

  status: BookingStatus;
  respondedAt?: Date;

  // payment
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  completedAt?: Date;
  disputeDeadline?: Date; // completedAt + 3 days

  disputeReason?: string;
  disputedAt?: Date;
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
       enum: ["pending", "accepted", "declined", "cancelled", "paid", "completed", "disputed"],
      default: "pending",
      index: true,
    },
    respondedAt: { type: Date },
    completedAt: { type: Date },
    disputeDeadline: { type: Date },
    disputeReason: { type: String, maxlength: 1000 },
    disputedAt: { type: Date },

    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ learner: 1, status: 1 });
bookingSchema.index({ mentor: 1, status: 1 });

export default model<IBooking>("Booking", bookingSchema); 