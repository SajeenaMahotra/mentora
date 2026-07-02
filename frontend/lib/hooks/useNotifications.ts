"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getNotifications, markAllRead as apiMarkAllRead, markOneRead as apiMarkOneRead, INotification } from "../api/notification";
import { useAuth } from "@/context/authContext";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      setNotifications(res.data?.data?.notifications ?? []);
      setUnreadCount(res.data?.data?.unread ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    fetchNotifications();

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("register", user._id));
    socket.on("notification", (notif: INotification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    return () => { socket.disconnect(); };
  }, [isAuthenticated, user?._id, fetchNotifications]);

  const markAllRead = async () => {
    await apiMarkAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: string) => {
    await apiMarkOneRead(id);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return { notifications, unreadCount, loading, markAllRead, markOneRead };
}
