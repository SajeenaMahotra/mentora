import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

export async function getNotificationsAction(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.unreadOnly) query.set("unreadOnly", String(params.unreadOnly));
    const res = await api.get(`${ENDPOINTS.NOTIFICATIONS}?${query.toString()}`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load notifications" };
  }
}

export async function getUnreadCountAction() {
  try {
    const res = await api.get(ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load unread count" };
  }
}

export async function markAsReadAction(id: string) {
  try {
    const res = await api.patch(ENDPOINTS.NOTIFICATION_MARK_READ(id));
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to mark notification as read" };
  }
}

export async function markAllAsReadAction() {
  try {
    const res = await api.patch(ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to mark all as read" };
  }
}