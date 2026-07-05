"use client";
import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { useAuth } from "./authContext";
import { getSocket } from "@/lib/socket";
import { getConversations, ConversationSummary, ChatParticipant } from "@/lib/api/chat";

interface ConversationUpdatedPayload {
  conversationId: string;
  participant: ChatParticipant;
  lastMessageAt: string;
  lastMessagePreview: string;
  senderId: string;
}

interface ChatContextType {
  conversations: ConversationSummary[];
  loading: boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  totalUnread: number;
  refresh: () => void;
  openConversation: (conversation: ConversationSummary) => void;
  pendingOpenId: string | null;
  clearPendingOpen: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const setActiveConversationId = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setActiveConversationIdState(id);
    if (id) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    }
  }, []);

  const refresh = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    getConversations()
      .then((res) => setConversations(res.data.data ?? []))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socket = getSocket();
    if (!socket) return;

    function handleConversationUpdated(payload: ConversationUpdatedPayload) {
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === payload.conversationId);
        const isActive = activeIdRef.current === payload.conversationId;
        const isSelf = payload.senderId === user!._id;
        const currentUnread = existingIndex >= 0 ? prev[existingIndex].unreadCount : 0;

        const updated: ConversationSummary = {
          id: payload.conversationId,
          participant: payload.participant,
          lastMessageAt: payload.lastMessageAt,
          lastMessagePreview: payload.lastMessagePreview,
          unreadCount: isActive || isSelf ? currentUnread : currentUnread + 1,
        };

        const withoutOld =
          existingIndex >= 0 ? [...prev.slice(0, existingIndex), ...prev.slice(existingIndex + 1)] : prev;

        return [updated, ...withoutOld];
      });
    }

    socket.on("conversation_updated", handleConversationUpdated);
    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
    };
  }, [isAuthenticated, user]);

  const openConversation = useCallback((conversation: ConversationSummary) => {
  setConversations((prev) => {
    const existingIndex = prev.findIndex((c) => c.id === conversation.id);
    if (existingIndex >= 0) {
      const existing = prev[existingIndex];
      const merged: ConversationSummary = {
        ...existing,
        participant: conversation.participant ?? existing.participant,
        lastMessageAt: existing.lastMessageAt ?? conversation.lastMessageAt,
        lastMessagePreview: existing.lastMessagePreview ?? conversation.lastMessagePreview,
      };
      const next = [...prev];
      next[existingIndex] = merged;
      return next;
    }
    return [conversation, ...prev];
  });
  setPendingOpenId(conversation.id);
}, []);

  const clearPendingOpen = useCallback(() => setPendingOpenId(null), []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        loading,
        activeConversationId,
        setActiveConversationId,
        totalUnread,
        refresh,
        openConversation,
        pendingOpenId,
        clearPendingOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}