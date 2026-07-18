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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(12).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;


export const updateProfileSchema = z.object({
  fullname: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
}).refine((data) => data.fullname !== undefined || data.bio !== undefined, {
  message: "At least one field must be provided",
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    password: z.string().min(12).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email(),
  currentPassword: z.string().min(1),
});
export type ChangeEmailDto = z.infer<typeof changeEmailSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

export const updateSubjectsSchema = z.object({
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
});
export type UpdateSubjectsDto = z.infer<typeof updateSubjectsSchema>;

export const disableMfaSchema = z.object({
  currentPassword: z.string().min(1),
  code: z.string().min(6), // TOTP or recovery code, same as login verify
});
export type DisableMfaDto = z.infer<typeof disableMfaSchema>;

export const forceChangePasswordSchema = z
  .object({
    tempToken: z.string().min(1),
    password: z.string().min(12).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ForceChangePasswordDto = z.infer<typeof forceChangePasswordSchema>;


export const importDataSchema = z
  .object({
    profile: z.object({
      fullname: z.string().trim().min(2).max(100).nullish(),
      bio: z.string().trim().max(1000).nullish(),
    }),
  })
  .refine(
    (d) => typeof d.profile.fullname === "string" || typeof d.profile.bio === "string",
    { message: "Import file contains no restorable profile fields" }
  );

export type ImportDataDto = z.infer<typeof importDataSchema>;