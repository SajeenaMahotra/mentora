"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { getMessages, ChatMessage } from "@/lib/api/chat";
import { useAuth } from "@/context/authContext";

const TYPING_STOP_DELAY = 1500;
const PAGE_LIMIT = 20;

interface AckResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export function useChat(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oldestMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    if (!socket) return;

    let cancelled = false;
    setMessages([]);
    setHasMore(false);
    setJoinError(null);
    oldestMessageId.current = null;

    function handleConnect() {
      setIsConnected(true);
      socket!.emit("join_conversation", { conversationId }, (res: AckResponse) => {
        if (!res.success) {
          setJoinError(res.message ?? "Unable to join conversation");
        }
      });
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    function handleNewMessage(message: ChatMessage) {
      if (message.conversation !== conversationId) return;
      setMessages((prev) => [...prev, message]);
      socket!.emit("mark_read", { conversationId }, () => {});
    }

    function handleTyping(data: { userId: string }) {
      if (data.userId !== user?._id) setOtherTyping(true);
    }

    function handleStopTyping(data: { userId: string }) {
      if (data.userId !== user?._id) setOtherTyping(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    if (socket.connected) handleConnect();

    setIsLoadingHistory(true);
    getMessages(conversationId)
      .then((res) => {
        if (cancelled) return;
        const page: ChatMessage[] = res.data.data ?? [];
        setHasMore(page.length === PAGE_LIMIT);
        if (page.length > 0) oldestMessageId.current = page[page.length - 1]._id;
        setMessages(page.slice().reverse());
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
      socket.emit("leave_conversation", { conversationId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, user?._id]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || !hasMore || !oldestMessageId.current) return;

    const res = await getMessages(conversationId, oldestMessageId.current);
    const page: ChatMessage[] = res.data.data ?? [];

    setHasMore(page.length === PAGE_LIMIT);
    if (page.length > 0) oldestMessageId.current = page[page.length - 1]._id;

    setMessages((prev) => [...page.slice().reverse(), ...prev]);
  }, [conversationId, hasMore]);

  const sendMessage = useCallback(
    (text: string): Promise<AckResponse> => {
      return new Promise((resolve) => {
        const socket = getSocket();
        if (!socket || !conversationId || !text.trim()) {
          return resolve({ success: false, message: "Not connected" });
        }
        socket.emit("send_message", { conversationId, content: text.trim() }, (res: AckResponse) => {
          resolve(res);
        });
      });
    },
    [conversationId]
  );

  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit("typing", { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId });
    }, TYPING_STOP_DELAY);
  }, [conversationId]);

  return {
    messages,
    isConnected,
    isLoadingHistory,
    hasMore,
    otherTyping,
    joinError,
    sendMessage,
    emitTyping,
    loadOlder,
  };
}