import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * All environment variables are validated at startup.
 * If any required variable is missing or malformed, the app fails fast
 * instead of running with insecure defaults (e.g. a missing JWT secret).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5050),
  CLIENT_URL: z.string().url(),

  MONGODB_URI: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  COOKIE_SECRET: z.string().min(32),

  PASSWORD_MIN_LENGTH: z.coerce.number().default(12),
  PASSWORD_MAX_LENGTH: z.coerce.number().default(128),
  PASSWORD_HISTORY_COUNT: z.coerce.number().default(5),
  PASSWORD_EXPIRY_DAYS: z.coerce.number().default(90),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  MAX_FAILED_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOCKOUT_DURATION_MINUTES: z.coerce.number().default(15),
  CAPTCHA_THRESHOLD_ATTEMPTS: z.coerce.number().default(3),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),

  MFA_ISSUER: z.string().default("Mentora"),

  HCAPTCHA_SECRET: z.string().optional(),
  HCAPTCHA_SITE_KEY: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  FIELD_ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex

  IP_BLOCK_MAX_FAILURES: z.coerce.number().default(5), // failed attempts from one IP, across ALL accounts
  IP_BLOCK_WINDOW_MINUTES: z.coerce.number().default(15), // time window failures are counted in
  IP_BLOCK_DURATION_MINUTES: z.coerce.number().default(30), // how long the IP stays blocked

  ADMIN_IP_ALLOWLIST_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  ADMIN_IP_ALLOWLIST: z.string().default(""), // comma-separated IPs, e.g. "203.0.113.5,203.0.113.6"
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(" Invalid environment configuration:");
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
