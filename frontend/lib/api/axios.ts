import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
  // --- NEW: send the httpOnly cookie automatically on every request. Without this,
  // the browser will not attach the auth cookie to cross-origin requests.
  withCredentials: true,
});

// --- REMOVED: the request interceptor that read the token from localStorage and
// attached it as an Authorization header. The cookie is now sent automatically by
// the browser, so there is nothing for the frontend to read or attach.

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes("/auth/login");
    const isMfaVerifyRequest = err.config?.url?.includes("/auth/mfa/login-verify");
    const isMeRequest = err.config?.url?.includes("/users/me");

    if (
      err.response?.status === 401 &&
      !isLoginRequest &&
      !isMfaVerifyRequest &&
      !isMeRequest &&
      typeof window !== "undefined"
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;