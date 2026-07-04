// dtos/chat.dto.ts
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const startConversationSchema = z.object({
  mentorId: objectIdSchema,
});
export type StartConversationDto = z.infer<typeof startConversationSchema>;

export const getMessagesQuerySchema = z.object({
  before: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type GetMessagesQueryDto = z.infer<typeof getMessagesQuerySchema>;

// Used to validate the socket "send_message" payload (not an HTTP body,
// so no Zod middleware — validated manually inside the socket handler).
export const sendMessageSchema = z.object({
  conversationId: objectIdSchema,
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
});
export type SendMessageDto = z.infer<typeof sendMessageSchema>;

export const joinConversationSchema = z.object({
  conversationId: objectIdSchema,
});
export type JoinConversationDto = z.infer<typeof joinConversationSchema>;