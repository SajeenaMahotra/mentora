import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

export async function getMe() {
  try {
    const res = await api.get(ENDPOINTS.ME);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load account" };
  }
}

export async function changePassword(data: {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}) {
  try {
    const res = await api.patch(ENDPOINTS.ME_PASSWORD, data);
    return { success: true, message: res.data.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to change password" };
  }
}

export async function changeEmail(data: { newEmail: string; currentPassword: string }) {
  try {
    const res = await api.patch(ENDPOINTS.ME_EMAIL, data);
    return { success: true, message: res.data.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to change email" };
  }
}

export async function setupMfa() {
  try {
    const res = await api.post(ENDPOINTS.MFA_SETUP);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to start MFA setup" };
  }
}

export async function verifyMfaSetup(token: string) {
  try {
    const res = await api.post(ENDPOINTS.MFA_VERIFY_SETUP, { token });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Invalid code" };
  }
}

export async function updateName(fullname: string) {
  try {
    const res = await api.patch(ENDPOINTS.ME, { fullname });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to update name" };
  }
}

export async function disableMfa(payload: { currentPassword: string; code: string }) {
  try {
    const res = await api.post(ENDPOINTS.MFA_DISABLE, payload);
    return { success: true, message: res.data.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to disable MFA" };
  }
}

export async function uploadPhoto(file: File) {
  try {
    const fd = new FormData();
    fd.append("photo", file);
    const res = await api.post(ENDPOINTS.ME_PHOTO, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to upload photo" };
  }
}