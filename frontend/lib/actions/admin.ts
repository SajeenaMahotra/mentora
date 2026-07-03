import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

export async function getAdminUsersAction(params: ListUsersParams = {}) {
  try {
    const res = await api.get(ENDPOINTS.ADMIN_USERS, { params });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load users" };
  }
}

export async function updateUserStatusAction(id: string, status: "active" | "suspended") {
  try {
    const res = await api.patch(ENDPOINTS.ADMIN_USER_STATUS(id), { status });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to update status" };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const res = await api.delete(ENDPOINTS.ADMIN_USER_DELETE(id));
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to delete user" };
  }
}

// Categories
export async function getCategoriesAction() {
  try {
    const res = await api.get(ENDPOINTS.CATEGORIES);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to load categories" };
  }
}

export async function createCategoryAction(name: string) {
  try {
    const res = await api.post(ENDPOINTS.CATEGORIES, { name });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to create category" };
  }
}

export async function updateCategoryAction(id: string, name: string) {
  try {
    const res = await api.patch(ENDPOINTS.CATEGORY_BY_ID(id), { name });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to update category" };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const res = await api.delete(ENDPOINTS.CATEGORY_BY_ID(id));
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed to delete category" };
  }
}