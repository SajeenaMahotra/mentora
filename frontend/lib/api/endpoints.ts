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
  MFA_DISABLE: "/auth/disable-mfa",

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
  // Admin — disputes
  ADMIN_DISPUTES: "/admin/disputes",
  ADMIN_DISPUTE_REFUND: (id: string) => `/admin/disputes/${id}/refund`,
  ADMIN_DISPUTE_REJECT: (id: string) => `/admin/disputes/${id}/reject`,

  ADMIN_AUDIT_LOGS: "/admin/audit-logs",

  // Categories
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,

  // Chat
  CONVERSATIONS: "/conversations",
  CONVERSATION_MESSAGES: (id: string, before?: string) =>
    before
      ? `/conversations/${id}/messages?before=${before}`
      : `/conversations/${id}/messages`,

  // Bookings
  BOOKINGS: "/bookings",
  BOOKINGS_MENTOR: "/bookings/mentor",
  BOOKINGS_LEARNER: "/bookings/learner",
  BOOKING_ACCEPT: (id: string) => `/bookings/${id}/accept`,
  BOOKING_DECLINE: (id: string) => `/bookings/${id}/decline`,
  BOOKING_CANCEL: (id: string) => `/bookings/${id}/cancel`,
  BOOKING_CHECKOUT: (id: string) => `/bookings/${id}/checkout`,
  BOOKING_COMPLETE: (id: string) => `/bookings/${id}/complete`,
  BOOKING_DISPUTE: (id: string) => `/bookings/${id}/dispute`,

  // Notifications
  NOTIFICATIONS: "/notifications",
  NOTIFICATIONS_UNREAD_COUNT: "/notifications/unread-count",
  NOTIFICATION_MARK_READ: (id: string) => `/notifications/${id}/read`,
  NOTIFICATIONS_MARK_ALL_READ: "/notifications/read-all",
};