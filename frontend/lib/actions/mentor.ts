import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

export async function getCategories() {
  try {
    const res = await api.get(ENDPOINTS.CATEGORIES);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load categories" };
  }
}

export async function updateSubjects(subjectIds: string[]) {
  try {
    const res = await api.patch(ENDPOINTS.ME_SUBJECTS, { subjects: subjectIds });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to update subjects" };
  }
}

export async function updateProfile(data: { fullname?: string; bio?: string }) {
  try {
    const res = await api.patch(ENDPOINTS.ME, data);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to update profile" };
  }
}

export async function createPackage(data: {
  title: string;
  description: string;
  subject: string;
  durationValue: number;
  durationUnit: "day" | "week" | "month";
  sessionType: "online" | "in-person" | "hybrid";
  price: number;
}) {
  try {
    const res = await api.post(ENDPOINTS.PACKAGES, data);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to create package" };
  }
}

export async function getMyPackages() {
  try {
    const res = await api.get(ENDPOINTS.PACKAGES_MINE);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load packages" };
  }
}

export async function getMyProfile() {
  try {
    const res = await api.get(ENDPOINTS.ME);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load profile" };
  }
}