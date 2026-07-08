import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  booking: Types.ObjectId; // 1:1 with booking
  learner: Types.ObjectId;
  mentor: Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    learner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

export default model<IReview>("Review", reviewSchema);