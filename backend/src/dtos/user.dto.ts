import { z } from "zod";

export const registerSchema = z
  .object({
    fullname: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(12).max(128),
    confirmPassword: z.string(),
    role: z.enum(["learner", "mentor"]), // admin not self-registerable
    captchaToken: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  captchaToken: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const mfaVerifySetupSchema = z.object({
  token: z.string().length(6),
});
export type MfaVerifySetupDto = z.infer<typeof mfaVerifySetupSchema>;

export const mfaLoginVerifySchema = z.object({
  tempToken: z.string().min(1),
  code: z.string().min(6), // 6-digit TOTP or 10-char recovery code
});
export type MfaLoginVerifyDto = z.infer<typeof mfaLoginVerifySchema>;

export const unlockAccountSchema = z.object({
  token: z.string().min(1),
});
export type UnlockAccountDto = z.infer<typeof unlockAccountSchema>;