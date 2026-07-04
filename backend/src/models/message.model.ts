import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 5000 },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for cursor pagination: fetch messages in a conversation
// ordered by createdAt, without a full scan.
messageSchema.index({ conversation: 1, createdAt: -1 });

export default model<IMessage>("Message", messageSchema);