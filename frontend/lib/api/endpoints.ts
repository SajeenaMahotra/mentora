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

  // Mentors
  MENTORS: "/serviceprovider",
  MENTOR_BY_ID: (id: string) => `/serviceprovider/${id}`,
  MENTOR_PROFILE: "/serviceprovider/profile",
  RATE_MENTOR: (id: string) => `/serviceprovider/${id}/rate`,

  // Misc
  CATEGORIES: "/servicecategory",
  BOOKINGS: "/booking",
  BOOKING_BY_ID: (id: string) => `/booking/${id}`,
  BOOKING_STATUS: (id: string) => `/booking/${id}/status`,
  CONVERSATIONS: "/chat/conversations",
  MESSAGES: (userId: string) => `/chat/messages/${userId}`,
  SEND_MESSAGE: "/chat/send",
  NOTIFICATIONS: "/notification",
  MARK_READ: (id: string) => `/notification/${id}/read`,
  ADMIN_USERS: "/admin/users",
  ADMIN_USER_BY_ID: (id: string) => `/admin/users/${id}`,
};