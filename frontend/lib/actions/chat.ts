import api from "@/lib/api/axios";

export async function getConversationsAction() {
  try {
    const res = await api.get("/chat/conversations");
    return { success: true, data: res.data?.data || res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function getMessagesAction(bookingId: string, page = 1) {
  try {
    const res = await api.get(`/chat/messages/${bookingId}`, { params: { page, size: 50 } });
    return { success: true, data: res.data?.data || res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function sendMessageAction(bookingId: string, content: string) {
  try {
    const res = await api.post("/chat/send", { bookingId, content });
    return { success: true, data: res.data?.data || res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}
