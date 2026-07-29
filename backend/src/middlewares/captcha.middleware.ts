import { Request, Response, NextFunction } from "express";
import { verifyCaptcha } from "../utils/captcha.util";
import { ValidationError, UnauthorizedError } from "../errors/AppError";

export async function requireCaptcha(req: Request, res: Response, next: NextFunction) {
  // return next(); // TEMP: bypass for X-Forwarded-For testing — REMOVE BEFORE SUBMISSION
  try {
    const { captchaToken } = req.body;
    if (!captchaToken || typeof captchaToken !== "string") {
      throw new ValidationError("CAPTCHA token required");
    }

    const isValid = await verifyCaptcha(captchaToken);
    if (!isValid) {
      throw new UnauthorizedError("CAPTCHA verification failed");
    }

    next();
  } catch (err) {
    next(err);
  }
}