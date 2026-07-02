import winston from "winston";
import { isProd } from "./env";

const { combine, timestamp, json, colorize, printf } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ts} [${level}] ${message}${metaStr}`;
  })
);

const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: isProd ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Dedicated security/audit log stream — separate file for easy review
// during the internal penetration test / report write-up.
const securityLogger = winston.createLogger({
  level: "info",
  format: prodFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/security.log" }),
  ],
});

type SecurityEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "MFA_CHALLENGE_SUCCESS"
  | "MFA_CHALLENGE_FAILURE"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "ROLE_CHANGED"
  | "TOKEN_REFRESH"
  | "TOKEN_REUSE_DETECTED"
  | "LOGOUT"
  | "RATE_LIMIT_EXCEEDED"
  | "CAPTCHA_FAILED"
  | "ACCESS_DENIED"
  | "REGISTER";

interface SecurityLogMeta {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  route?: string;
  details?: string;
}


export function logSecurityEvent(event: SecurityEvent, meta: SecurityLogMeta = {}) {
  securityLogger.info(event, meta);
}

export default logger;
