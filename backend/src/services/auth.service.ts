import { RegisterDto, LoginDto, MfaLoginVerifyDto, UnlockAccountDto, ForgotPasswordDto, ResetPasswordDto, DisableMfaDto, ForceChangePasswordDto } from "../dtos/user.dto";
import { userRepository } from "../repositories/user.repository";
import { ConflictError, UnauthorizedError, ForbiddenError, ValidationError } from "../errors/AppError";
import {
  assertPasswordStrength,
  hashPassword,
  comparePassword,
  assertNoPasswordReuse,
  buildPasswordHistoryUpdate,
} from "../utils/password.util";
import { signAccessToken, signMfaTempToken, verifyMfaTempToken, signPasswordChangeTempToken, verifyPasswordChangeTempToken } from "../utils/jwt.util";
import { encrypt, decrypt } from "../utils/crypto.util";
import { generateToken, hashToken } from "../utils/token.util";
import { sendMail } from "../utils/mailer.util";
import {
  generateSecret,
  generateQrCodeDataUrl,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "../utils/mfa.util";
import { auditLogService } from "./audit-log.service";
import { env } from "../config/env";

const MAX_FAILED_ATTEMPTS = 5;
const UNLOCK_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const PASSWORD_HISTORY_LIMIT = 5;

interface RequestContext {
  ip?: string;
  userAgent?: string;
}

// --- Password expiry check, shared by both the non-MFA and post-MFA login paths.
function isPasswordExpired(passwordChangedAt: Date): boolean {
  const expiryMs = env.PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - passwordChangedAt.getTime() > expiryMs;
}

export const authService = {
  async register(dto: RegisterDto) {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    assertPasswordStrength(dto.password, [dto.fullname, dto.email]);

    const passwordHash = await hashPassword(dto.password);

    const user = await userRepository.create({
      fullname: dto.fullname,
      email: dto.email,
      password: passwordHash,
      role: dto.role,
      passwordChangedAt: new Date(),
      passwordHistory: [{ hash: passwordHash, changedAt: new Date() }],
    });

    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    };
  },

  async login(dto: LoginDto, ctx: RequestContext = {}) {
    const user = await userRepository.findByEmailWithPassword(dto.email);
    if (!user) {
      await auditLogService.log({
        action: "LOGIN_FAILED",
        metadata: { email: dto.email, reason: "user_not_found" },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedError();
    }

    if (user.status !== "active") {
      await auditLogService.log({
        actor: user.id,
        action: "LOGIN_FAILED",
        metadata: { reason: "account_" + user.status },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new ForbiddenError(`Account is ${user.status}`);
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await auditLogService.log({
        actor: user.id,
        action: "LOGIN_FAILED",
        metadata: { reason: "account_locked" },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new ForbiddenError("Account locked due to too many failed login attempts. Check your email to unlock, or contact an admin.");
    }

    const passwordMatches = await comparePassword(dto.password, user.password);
    if (!passwordMatches) {
      const updated = await userRepository.incrementFailedAttempts(user.id);

      if (updated && updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        const { token, tokenHash } = generateToken();
        await userRepository.lockAccount(user.id, tokenHash, new Date(Date.now() + UNLOCK_TOKEN_TTL_MS));

        await sendMail(
          user.email,
          "Mentora account locked",
          `Your account was locked after ${MAX_FAILED_ATTEMPTS} failed login attempts.\n` +
            `Unlock it here: ${process.env.CLIENT_URL}/unlock-account?token=${token}\n` +
            `This link expires in 1 hour.`
        );

        await auditLogService.log({
          actor: user.id,
          action: "ACCOUNT_LOCKED",
          metadata: { reason: "too_many_failed_attempts" },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });

        throw new ForbiddenError("Account locked due to too many failed login attempts. Check your email to unlock.");
      }

      await auditLogService.log({
        actor: user.id,
        action: "LOGIN_FAILED",
        metadata: { reason: "wrong_password" },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });

      throw new UnauthorizedError();
    }

    await userRepository.resetFailedAttempts(user.id);

    if (user.mfaEnabled) {
      return {
        mfaRequired: true,
        tempToken: signMfaTempToken(user.id),
      };
    }

    // --- NEW: password expiry check (non-MFA path). Runs only after password is confirmed correct.
    if (isPasswordExpired(user.passwordChangedAt)) {
      await auditLogService.log({
        actor: user.id,
        action: "LOGIN_BLOCKED_PASSWORD_EXPIRED",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        mfaRequired: false,
        passwordChangeRequired: true,
        tempToken: signPasswordChangeTempToken(user.id),
      };
    }

    await auditLogService.log({
      actor: user.id,
      action: "LOGIN_SUCCESS",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    const token = signAccessToken({ sub: user.id, role: user.role });

    return {
      mfaRequired: false,
      passwordChangeRequired: false,
      token,
      data: {
        _id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        isProfileSetup: user.isProfileSetup,
      },
    };
  },

  // Step 1: generate a secret for an already-authenticated user, return QR for their app.
  async setupMfa(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError();
    if (user.mfaEnabled) throw new ConflictError("MFA is already enabled");

    const secret = generateSecret(user.email);
    await userRepository.setMfaSecret(userId, encrypt(secret.base32));

    const qrCodeDataUrl = await generateQrCodeDataUrl(secret.otpauth_url as string);

    return { qrCodeDataUrl, manualEntryKey: secret.base32 };
  },

  // Step 2: user submits a 6-digit code from their app to confirm setup and enable MFA.
  async verifyMfaSetup(userId: string, token: string, ctx: RequestContext = {}) {
    const user = await userRepository.findByIdWithMfaSecret(userId);
    if (!user || !user.mfaSecret) throw new ValidationError("MFA setup not started");

    const secret = decrypt(user.mfaSecret);
    if (!verifyTotp(secret, token)) {
      throw new UnauthorizedError("Invalid MFA code");
    }

    const recoveryCodes = generateRecoveryCodes();
    await userRepository.enableMfa(userId, recoveryCodes.map(hashRecoveryCode));

    await auditLogService.log({
      actor: userId,
      action: "MFA_ENABLED",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    // Plain codes returned ONCE — caller must show these to the user now.
    return { recoveryCodes };
  },

  // Step 3: completes login after mfaRequired:true — accepts either a TOTP code or a recovery code.
  async verifyMfaLogin(dto: MfaLoginVerifyDto, ctx: RequestContext = {}) {
    let payload;
    try {
      payload = verifyMfaTempToken(dto.tempToken);
    } catch {
      throw new UnauthorizedError("MFA session expired, please log in again");
    }

    const user = await userRepository.findByIdWithMfaSecret(payload.sub);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedError();
    }

    const isTotpValid = /^\d{6}$/.test(dto.code) && verifyTotp(decrypt(user.mfaSecret), dto.code);

    let isRecoveryValid = false;
    if (!isTotpValid) {
      const codeHash = hashRecoveryCode(dto.code);
      const match = user.mfaRecoveryCodes.find((c) => c.codeHash === codeHash && !c.used);
      if (match) {
        isRecoveryValid = true;
        await userRepository.markRecoveryCodeUsed(user.id, codeHash);
      }
    }

    if (!isTotpValid && !isRecoveryValid) {
      await auditLogService.log({
        actor: user.id,
        action: "MFA_LOGIN_FAILED",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedError("Invalid MFA code");
    }

    // --- NEW: password expiry check (post-MFA path). Runs only after MFA is confirmed valid.
    if (isPasswordExpired(user.passwordChangedAt)) {
      await auditLogService.log({
        actor: user.id,
        action: "LOGIN_BLOCKED_PASSWORD_EXPIRED",
        metadata: { via: isRecoveryValid ? "recovery_code" : "totp" },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        passwordChangeRequired: true,
        tempToken: signPasswordChangeTempToken(user.id),
      };
    }

    await auditLogService.log({
      actor: user.id,
      action: "LOGIN_SUCCESS",
      metadata: { via: isRecoveryValid ? "recovery_code" : "totp" },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    const token = signAccessToken({ sub: user.id, role: user.role });

    return {
      passwordChangeRequired: false,
      token,
      data: {
        _id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        isProfileSetup: user.isProfileSetup,
      },
    };
  },

  // --- NEW: completes login after passwordChangeRequired:true. Accepts only a new password —
  // no "current password" needed since they already proved identity (password + MFA if enabled)
  // to get this temp token in the first place. Logs them straight in afterward, same shape as login().
  async forceChangePassword(dto: ForceChangePasswordDto, ctx: RequestContext = {}) {
    let payload;
    try {
      payload = verifyPasswordChangeTempToken(dto.tempToken);
    } catch {
      throw new UnauthorizedError("Session expired, please log in again");
    }

    const user = await userRepository.findByIdWithPasswordAndMfa(payload.sub);
    if (!user) throw new UnauthorizedError();

    assertPasswordStrength(dto.password, [user.fullname, user.email]);
    await assertNoPasswordReuse(dto.password, user.password, user.passwordHistory);

    const newHash = await hashPassword(dto.password);
    const updatedHistory = buildPasswordHistoryUpdate(user.password, user.passwordChangedAt, user.passwordHistory);

    await userRepository.updatePassword(user.id, newHash, updatedHistory);

    await auditLogService.log({
      actor: user.id,
      action: "PASSWORD_CHANGED_FORCED_EXPIRY",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    const token = signAccessToken({ sub: user.id, role: user.role });

    return {
      token,
      data: {
        _id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        isProfileSetup: user.isProfileSetup,
      },
    };
  },

  // Self-service unlock via emailed token
  async unlockAccount(dto: UnlockAccountDto) {
    const user = await userRepository.findByUnlockToken(hashToken(dto.token));
    if (!user) {
      throw new ValidationError("Invalid or expired unlock link");
    }
    await userRepository.unlockAccount(user.id);

    await auditLogService.log({
      actor: user.id,
      action: "ACCOUNT_UNLOCKED",
      metadata: { via: "self_service" },
    });

    return { message: "Account unlocked. You can now log in." };
  },

  // Admin-triggered unlock (no token needed)
  async adminUnlockAccount(userId: string, actingAdminId?: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ValidationError("User not found");
    await userRepository.unlockAccount(userId);

    await auditLogService.log({
      actor: actingAdminId,
      action: "ACCOUNT_UNLOCKED",
      targetType: "User",
      targetId: userId,
      metadata: { via: "admin" },
    });

    return { message: `Account for ${user.email} unlocked.` };
  },

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await userRepository.findByEmail(dto.email);

    // Always return the same generic response — don't reveal whether the email exists.
    if (user) {
      const { token, tokenHash } = generateToken();
      await userRepository.setResetPasswordToken(user.id, tokenHash, new Date(Date.now() + RESET_TOKEN_TTL_MS));

      await sendMail(
        user.email,
        "Reset your Mentora password",
        `Reset your password here: ${process.env.CLIENT_URL}/reset-password?token=${token}\n` +
          `This link expires in 1 hour. If you didn't request this, ignore this email.`
      );

      await auditLogService.log({
        actor: user.id,
        action: "PASSWORD_RESET_REQUESTED",
      });
    }

    return { message: "If that email is registered, a reset link has been sent." };
  },

  async resetPassword(dto: ResetPasswordDto, ctx: RequestContext = {}) {
    const user = await userRepository.findByResetToken(hashToken(dto.token));
    if (!user) {
      throw new ValidationError("Invalid or expired reset link");
    }

    assertPasswordStrength(dto.password, [user.fullname, user.email]);
    await assertNoPasswordReuse(dto.password, user.password, user.passwordHistory);

    const newHash = await hashPassword(dto.password);
    const updatedHistory = buildPasswordHistoryUpdate(user.password, user.passwordChangedAt, user.passwordHistory);

    await userRepository.updatePassword(user.id, newHash, updatedHistory);

    await auditLogService.log({
      actor: user.id,
      action: "PASSWORD_RESET",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { message: "Password reset successful. You can now log in with your new password." };
  },

  async disableMfa(userId: string, dto: DisableMfaDto, ctx: RequestContext = {}) {
    const user = await userRepository.findByIdWithPasswordAndMfa(userId);
    if (!user) throw new UnauthorizedError();
    if (!user.mfaEnabled) throw new ValidationError("MFA is not enabled");

    const passwordMatches = await comparePassword(dto.currentPassword, user.password);
    if (!passwordMatches) throw new UnauthorizedError("Current password is incorrect");

    const isTotpValid = /^\d{6}$/.test(dto.code) && user.mfaSecret && verifyTotp(decrypt(user.mfaSecret), dto.code);

    let isRecoveryValid = false;
    if (!isTotpValid) {
      const codeHash = hashRecoveryCode(dto.code);
      const match = user.mfaRecoveryCodes.find((c) => c.codeHash === codeHash && !c.used);
      if (match) isRecoveryValid = true;
    }

    if (!isTotpValid && !isRecoveryValid) {
      throw new UnauthorizedError("Invalid MFA code");
    }

    await userRepository.disableMfa(userId);

    await auditLogService.log({
      actor: userId,
      action: "MFA_DISABLED",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { message: "Two-factor authentication disabled." };
  },
};