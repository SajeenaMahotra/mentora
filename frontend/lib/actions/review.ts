import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

export async function createReviewAction(bookingId: string, data: { rating: number; comment?: string }) {
  try {
    const res = await api.post(ENDPOINTS.BOOKING_REVIEW(bookingId), data);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to submit review" };
  }
}

export async function getMentorReviewsAction(mentorId: string, params?: { page?: number; limit?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const res = await api.get(`${ENDPOINTS.MENTOR_REVIEWS(mentorId)}?${query.toString()}`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load reviews" };
  }
}

export async function getMyReviewedBookingIdsAction() {
  try {
    const res = await api.get(ENDPOINTS.MY_REVIEWED_BOOKINGS);
    return { success: true, data: res.data.data as string[] };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load reviewed bookings", data: [] as string[] };
  }
}