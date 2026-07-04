import api from "./axios";
import { ENDPOINTS } from "./endpoints";

export interface ChatParticipant {
  _id: string;
  fullname: string;
  profilePhoto?: string;
}

export interface ConversationSummary {
  id: string;
  participant: ChatParticipant;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: ChatParticipant;
  text: string;
  readAt?: string;
  createdAt: string;
}

export async function startConversation(mentorId: string) {
  return api.post(ENDPOINTS.CONVERSATIONS, { mentorId });
}

export async function getConversations() {
  return api.get(ENDPOINTS.CONVERSATIONS);
}

export async function getMessages(conversationId: string, before?: string) {
  return api.get(ENDPOINTS.CONVERSATION_MESSAGES(conversationId, before));
}