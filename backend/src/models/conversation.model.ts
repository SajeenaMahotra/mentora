import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
  learner: Types.ObjectId;
  mentor: Types.ObjectId;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    learner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date },
    lastMessagePreview: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

// One thread per learner-mentor pair. Only the learner may create a
// conversation; enforced in the service layer, not the schema.
conversationSchema.index({ learner: 1, mentor: 1 }, { unique: true });
conversationSchema.index({ learner: 1, lastMessageAt: -1 });
conversationSchema.index({ mentor: 1, lastMessageAt: -1 });

export default model<IConversation>("Conversation", conversationSchema);