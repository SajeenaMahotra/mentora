import { Schema, model, Document, Types } from "mongoose";

export type DurationUnit = "day" | "week" | "month";
export type SessionType = "online" | "in-person" | "hybrid";

export interface IPackage extends Document {
  title: string;
  description: string;
  subject: Types.ObjectId; // ref Category
  mentor: Types.ObjectId; // ref User
  durationValue: number;
  durationUnit: DurationUnit;
  sessionType: SessionType;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackage>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    subject: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    durationValue: { type: Number, required: true, min: 1 },
    durationUnit: { type: String, enum: ["day", "week", "month"], required: true },
    sessionType: { type: String, enum: ["online", "in-person", "hybrid"], required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

packageSchema.index({ mentor: 1 });
packageSchema.index({ subject: 1 });

export default model<IPackage>("Package", packageSchema);