import api from "./axios";

export interface INotification {
  _id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: string;
}

export async function getNotifications() {
  return api.get("/notification");
}

export async function markAllRead() {
  return api.patch("/notification/mark-all-read");
}

export async function markOneRead(id: string) {
  return api.patch(`/notification/${id}/read`);
}

export async function deleteAllNotifications() {
  return api.delete("/notification/all");
}
