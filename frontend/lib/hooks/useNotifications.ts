"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/authContext";
import { getSocket } from "@/lib/socket";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markAsReadAction,
  markAllAsReadAction,
} from "@/lib/actions/notification";

// Shape NotificationBell.tsx already expects (snake_case, "message" not "body").
// Kept here rather than changing the bell component, since it's the one
// piece of this feature that was already finished.
export interface NotificationView {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// Backend (REST) shape: raw Mongoose doc — _id, body, isRead, createdAt.
interface RawNotificationRest {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Backend (socket) shape: notificationService emits "id", not "_id".
interface RawNotificationSocket {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

function toView(raw: RawNotificationRest | RawNotificationSocket): NotificationView {
  const id = "_id" in raw ? raw._id : raw.id;
  return {
    _id: id,
    type: raw.type,
    title: raw.title,
    message: raw.body,
    link: raw.link,
    is_read: raw.isRead,
    created_at: raw.createdAt,
  };
}

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    Promise.all([getNotificationsAction({ page: 1, limit: 20 }), getUnreadCountAction()])
      .then(([listRes, countRes]) => {
        if (listRes.success) {
          const items: RawNotificationRest[] = listRes.data?.notifications ?? [];
          setNotifications(items.map(toView));
        }
        if (countRes.success) {
          setUnreadCount(countRes.data?.count ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socket = getSocket();
    if (!socket) return;

    function handleNotificationCreated(payload: RawNotificationSocket) {
      setNotifications((prev) => [toView(payload), ...prev]);
      setUnreadCount((prev) => prev + 1);
    }

    socket.on("notification_created", handleNotificationCreated);
    return () => {
      socket.off("notification_created", handleNotificationCreated);
    };
  }, [isAuthenticated, user]);

  const markOneRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    const res = await markAsReadAction(id);
    if (!res.success) {
      // revert on failure so the UI doesn't lie about read state
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    const res = await markAllAsReadAction();
    if (!res.success) {
      refresh();
    }
  }, [refresh]);

  return { notifications, unreadCount, loading, markAllRead, markOneRead, refresh };
}