import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

export async function createBookingAction(packageId: string) {
  try {
    const res = await api.post(ENDPOINTS.BOOKINGS, { packageId });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to send booking request" };
  }
}

export async function getBookingsForLearnerAction(params?: { status?: string; page?: number; limit?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const res = await api.get(`${ENDPOINTS.BOOKINGS_LEARNER}?${query.toString()}`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load bookings" };
  }
}

export async function getBookingsForMentorAction(params?: { status?: string; page?: number; limit?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const res = await api.get(`${ENDPOINTS.BOOKINGS_MENTOR}?${query.toString()}`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load bookings" };
  }
}

export async function acceptBookingAction(id: string) {
  try {
    const res = await api.patch(ENDPOINTS.BOOKING_ACCEPT(id));
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to accept booking" };
  }
}

export async function declineBookingAction(id: string) {
  try {
    const res = await api.patch(ENDPOINTS.BOOKING_DECLINE(id));
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to decline booking" };
  }
}

export async function cancelBookingAction(id: string) {
  try {
    const res = await api.patch(ENDPOINTS.BOOKING_CANCEL(id));
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to cancel booking" };
  }
}

export async function checkoutBookingAction(id: string) {
  try {
    const res = await api.post(ENDPOINTS.BOOKING_CHECKOUT(id));
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to start checkout" };
  }
}