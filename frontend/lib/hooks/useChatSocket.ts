"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  _id: string;
  session_id: string;
  sender_id: { _id: string; fullname: string; email: string; imageUrl?: string };
  sender_role: "user" | "provider";
  content: string;
  is_read: boolean;
  created_at: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function useChatSocket(sessionId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const token = getToken();
    if (!token) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_room", { sessionId });
    });

    socket.on("room_joined", ({ messages: history }: { messages: ChatMessage[]; total: number }) => {
      setMessages(history);
    });

    socket.on("new_message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      socket.emit("mark_read", { sessionId });
    });

    socket.on("user_typing", () => setIsTyping(true));
    socket.on("user_stopped_typing", () => setIsTyping(false));
    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      socket.emit("leave_room", { sessionId });
      socket.disconnect();
      socketRef.current = null;
      setMessages([]);
      setIsConnected(false);
    };
  }, [sessionId]);

  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current || !sessionId) return;
    socketRef.current.emit("send_message", { sessionId, content });
  }, [sessionId]);

  const emitTyping = useCallback(() => {
    if (!socketRef.current || !sessionId) return;
    socketRef.current.emit("typing_start", { sessionId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing_stop", { sessionId });
    }, 1500);
  }, [sessionId]);

  return { messages, isConnected, isTyping, sendMessage, emitTyping };
}
