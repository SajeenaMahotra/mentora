import { Response } from "express";
import { isProd } from "../config/env";

export const AUTH_COOKIE_NAME = "token";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  maxAge: 15 * 60 * 1000, // matches the 15-minute access token expiry
  path: "/",
};

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/", sameSite: "lax", httpOnly: true, secure: isProd });
}