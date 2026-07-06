import { Schema, model, Document, Types } from "mongoose";

export type SessionType = "online" | "in-person" | "hybrid";
export type BookingStatus = "pending" | "accepted" | "declined" | "cancelled";

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
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
      index: true,
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ learner: 1, status: 1 });
bookingSchema.index({ mentor: 1, status: 1 });

export default model<IBooking>("Booking", bookingSchema);