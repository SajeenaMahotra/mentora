export const ENDPOINTS = {
  // Auth
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  MFA_LOGIN_VERIFY: "/auth/mfa/login-verify",
  MFA_SETUP: "/auth/mfa/setup",
  MFA_VERIFY_SETUP: "/auth/mfa/verify-setup",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  UNLOCK_ACCOUNT: "/auth/unlock-account",

  // User / profile
  ME: "/users/me",
  ME_PHOTO: "/users/me/photo",
  ME_PASSWORD: "/users/me/password",
  ME_EMAIL: "/users/me/email",
  ME_SUBJECTS: "/users/me/subjects",

  // Packages
  PACKAGES: "/packages",
  PACKAGES_MINE: "/packages/mine",
  PACKAGE_BY_ID: (id: string) => `/packages/${id}`,

   // Admin — users
  ADMIN_USERS: "/admin/users",
  ADMIN_USER_STATUS: (id: string) => `/admin/users/${id}/status`,
  ADMIN_USER_DELETE: (id: string) => `/admin/users/${id}`,

  // Categories
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,
};