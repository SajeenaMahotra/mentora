"use server";
import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

export async function createBookingAction(data: {
  provider_id: string;
  scheduled_at: string;
  address: string;
  phone_number: string;
  note?: string;
}) {
  try {
    const res = await api.post(ENDPOINTS.BOOKINGS, { ...data, severity: "normal" });
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Booking failed" };
  }
}

export async function getMyBookingsAction() {
  try {
    const res = await api.get(ENDPOINTS.BOOKINGS);
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, message: "Failed to load bookings" };
  }
}

export async function updateBookingStatusAction(id: string, status: string) {
  try {
    const res = await api.patch(ENDPOINTS.BOOKING_STATUS(id), { status });
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}
