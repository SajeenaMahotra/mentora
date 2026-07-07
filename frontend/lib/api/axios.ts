import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes("/auth/login");
    const isMfaVerifyRequest = err.config?.url?.includes("/auth/mfa/login-verify");

    if (
      err.response?.status === 401 &&
      !isLoginRequest &&
      !isMfaVerifyRequest &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;