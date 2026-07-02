"use server";
import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

export async function getMentorsAction(params?: { category?: string; search?: string }) {
  try {
    const res = await api.get(ENDPOINTS.MENTORS, { params });
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function getMentorByIdAction(id: string) {
  try {
    const res = await api.get(ENDPOINTS.MENTOR_BY_ID(id));
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function getCategoriesAction() {
  try {
    const res = await api.get(ENDPOINTS.CATEGORIES);
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, message: "Failed to load categories" };
  }
}

export async function rateMentorAction(id: string, rating: number) {
  try {
    await api.post(ENDPOINTS.RATE_MENTOR(id), { rating });
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function updateMentorProfileAction(data: FormData) {
  try {
    const res = await api.put(ENDPOINTS.MENTOR_PROFILE, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}
