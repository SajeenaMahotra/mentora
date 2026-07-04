// message.service.ts
import { messageRepository } from "../repositories/message.repository";
import { conversationRepository } from "../repositories/conversation.repository";
import { conversationService } from "./conversation.service";
import { sendMessageSchema } from "../dtos/chat.dto";
import { ValidationError } from "../errors/AppError";

const DEFAULT_PAGE_LIMIT = 20;
const PREVIEW_MAX_LENGTH = 200;

export const messageService = {
  // Used by the socket "send_message" handler. Re-validates the payload
  // here (not just at the socket entry point) so this function is safe
  // to call from anywhere, REST included, later.
  async sendMessage(conversationId: string, senderId: string, rawContent: string) {
    const parsed = sendMessageSchema.safeParse({ conversationId, content: rawContent });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid message");
    }

    await conversationService.getAuthorizedConversation(conversationId, senderId);

    const message = await messageRepository.create(conversationId, senderId, parsed.data.content);

    const preview = parsed.data.content.slice(0, PREVIEW_MAX_LENGTH);
    await conversationRepository.updateLastMessage(conversationId, preview, message.createdAt);

    return message.populate("sender", "fullname profilePhoto");
  },

  async getMessages(conversationId: string, userId: string, before?: string, limit = DEFAULT_PAGE_LIMIT) {
    await conversationService.getAuthorizedConversation(conversationId, userId);

    return messageRepository.findByConversation({ conversationId, before, limit });
  },

  async markThreadRead(conversationId: string, userId: string) {
    await conversationService.getAuthorizedConversation(conversationId, userId);
    return messageRepository.markThreadRead(conversationId, userId);
  },
};