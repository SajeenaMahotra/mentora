import { UserRole } from "./user.type";

export interface SocketUser {
  id: string;
  role: UserRole;
}

export interface SocketData {
  user: SocketUser;
}

export interface AckResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ClientToServerEvents {
  join_conversation: (
    payload: { conversationId: string },
    callback: (res: AckResponse) => void
  ) => void;
  leave_conversation: (payload: { conversationId: string }) => void;
  send_message: (
    payload: { conversationId: string; content: string },
    callback: (res: AckResponse) => void
  ) => void;
  typing: (payload: { conversationId: string }) => void;
  stop_typing: (payload: { conversationId: string }) => void;
  mark_read: (
    payload: { conversationId: string },
    callback: (res: AckResponse) => void
  ) => void;
}

export interface ServerToClientEvents {
  new_message: (message: unknown) => void;
  typing: (data: { userId: string }) => void;
  stop_typing: (data: { userId: string }) => void;
  thread_read: (data: { conversationId: string; userId: string }) => void;
  conversation_updated: (data: {
    conversationId: string;
    participant: { _id: string; fullname: string; profilePhoto?: string };
    lastMessageAt: string;
    lastMessagePreview: string;
    senderId: string;
  }) => void;
  notification_created: (data: {
    id: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
  }) => void;
}