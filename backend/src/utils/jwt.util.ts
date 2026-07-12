import jwt from "jsonwebtoken";
import { UserRole } from "../types/user.type";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const ACCESS_EXPIRES_IN = "15m";

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
   iat?: number;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

// --- MFA temp token: issued after password check, before MFA verification.
// Short-lived, distinct "type" claim so it can never be used as a real access token.
export interface MfaTempTokenPayload {
  sub: string;
  type: "mfa_pending";
}

const MFA_TEMP_EXPIRES_IN = "5m";

export function signMfaTempToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "mfa_pending" }, ACCESS_SECRET, { expiresIn: MFA_TEMP_EXPIRES_IN });
}

export function verifyMfaTempToken(token: string): MfaTempTokenPayload {
  const payload = jwt.verify(token, ACCESS_SECRET) as MfaTempTokenPayload;
  if (payload.type !== "mfa_pending") {
    throw new Error("Invalid token type");
  }
  return payload;
}

// --- Password-change temp token: issued when login succeeds (and MFA passes, if enabled)
// but the password has expired. Grants ONLY access to the force-change-password endpoint,
// never a real access token, so an expired-password account can't be used for anything else.
export interface PasswordChangeTempTokenPayload {
  sub: string;
  type: "password_change_required";
}

const PASSWORD_CHANGE_TEMP_EXPIRES_IN = "10m";

export function signPasswordChangeTempToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "password_change_required" }, ACCESS_SECRET, {
    expiresIn: PASSWORD_CHANGE_TEMP_EXPIRES_IN,
  });
}

export function verifyPasswordChangeTempToken(token: string): PasswordChangeTempTokenPayload {
  const payload = jwt.verify(token, ACCESS_SECRET) as PasswordChangeTempTokenPayload;
  if (payload.type !== "password_change_required") {
    throw new Error("Invalid token type");
  }
  return payload;
}