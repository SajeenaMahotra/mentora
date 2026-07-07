import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  actor?: Types.ObjectId; // null for unauthenticated attempts
  action: string; // e.g. "LOGIN_FAILED", "USER_SUSPENDED", "REFUND_ISSUED"
  targetType?: string; // "User" | "Booking" | etc.
  targetId?: Types.ObjectId;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    targetType: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default model<IAuditLog>("AuditLog", auditLogSchema);