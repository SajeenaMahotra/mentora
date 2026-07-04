import Message, { IMessage } from "../models/message.model";

interface FindByConversationParams {
  conversationId: string;
  before?: string;
  limit: number;
}

export const messageRepository = {
  create(conversationId: string, senderId: string, text: string) {
    return Message.create({ conversation: conversationId, sender: senderId, text });
  },

  findById(id: string) {
    return Message.findById(id);
  },

  // Cursor pagination: fetch messages older than `before` (a message id),
  // newest first. Client requests the next page using the id of the last
  // message it received.
  async findByConversation({ conversationId, before, limit }: FindByConversationParams) {
    const filter: Record<string, any> = { conversation: conversationId };

    if (before) {
      const cursor = await Message.findById(before).select("createdAt");
      if (cursor) {
        filter.createdAt = { $lt: cursor.createdAt };
      }
    }

    return Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "fullname profilePhoto");
  },

  markThreadRead(conversationId: string, readerId: string) {
    return Message.updateMany(
      { conversation: conversationId, sender: { $ne: readerId }, readAt: { $exists: false } },
      { readAt: new Date() }
    );
  },

  countUnread(conversationId: string, userId: string) {
    return Message.countDocuments({
      conversation: conversationId,
      sender: { $ne: userId },
      readAt: { $exists: false },
    });
  },
};