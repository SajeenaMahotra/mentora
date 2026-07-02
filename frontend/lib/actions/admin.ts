import api from "@/lib/api/axios";

export async function getAdminUsersAction() {
  try {
    const res = await api.get("/admin/users");
    return { success: true, data: res.data?.data || res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function getAdminUserByIdAction(id: string) {
  try {
    const res = await api.get(`/admin/users/${id}`);
    return { success: true, data: res.data?.data || res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function updateAdminUserAction(id: string, data: { is_active?: boolean; role?: string }) {
  try {
    const res = await api.patch(`/admin/users/${id}`, data);
    return { success: true, data: res.data?.data || res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function deleteAdminUserAction(id: string) {
  try {
    await api.delete(`/admin/users/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function getAdminBookingsAction() {
  try {
    const res = await api.get("/admin/bookings");
    return { success: true, data: res.data?.data || res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function getAdminStatsAction() {
  try {
    const res = await api.get("/admin/stats");
    return { success: true, data: res.data?.data || res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}
