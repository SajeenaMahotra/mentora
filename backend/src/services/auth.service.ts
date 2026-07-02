import { RegisterDto, LoginDto, MfaLoginVerifyDto, UnlockAccountDto, ForgotPasswordDto, ResetPasswordDto } from "../dtos/user.dto";
import { userRepository } from "../repositories/user.repository";
import { ConflictError, UnauthorizedError, ForbiddenError, ValidationError } from "../errors/AppError";
import {
  assertPasswordStrength,
  hashPassword,
  comparePassword,
  assertNoPasswordReuse,
  buildPasswordHistoryUpdate,
} from "../utils/password.util";
import { signAccessToken, signMfaTempToken, verifyMfaTempToken } from "../utils/jwt.util";
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

const MAX_FAILED_ATTEMPTS = 5;
const UNLOCK_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const PASSWORD_HISTORY_LIMIT = 5;

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

  async login(dto: LoginDto) {
    const user = await userRepository.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedError();
    }

    if (user.status !== "active") {
      throw new ForbiddenError(`Account is ${user.status}`);
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
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

        throw new ForbiddenError("Account locked due to too many failed login attempts. Check your email to unlock.");
      }

      throw new UnauthorizedError();
    }

    await userRepository.resetFailedAttempts(user.id);

    if (user.mfaEnabled) {
      return {
        mfaRequired: true,
        tempToken: signMfaTempToken(user.id),
      };
    }

    const token = signAccessToken({ sub: user.id, role: user.role });

    return {
      mfaRequired: false,
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
  async verifyMfaSetup(userId: string, token: string) {
    const user = await userRepository.findByIdWithMfaSecret(userId);
    if (!user || !user.mfaSecret) throw new ValidationError("MFA setup not started");

    const secret = decrypt(user.mfaSecret);
    if (!verifyTotp(secret, token)) {
      throw new UnauthorizedError("Invalid MFA code");
    }

    const recoveryCodes = generateRecoveryCodes();
    await userRepository.enableMfa(userId, recoveryCodes.map(hashRecoveryCode));

    // Plain codes returned ONCE — caller must show these to the user now.
    return { recoveryCodes };
  },

  // Step 3: completes login after mfaRequired:true — accepts either a TOTP code or a recovery code.
  async verifyMfaLogin(dto: MfaLoginVerifyDto) {
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
      throw new UnauthorizedError("Invalid MFA code");
    }

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
    return { message: "Account unlocked. You can now log in." };
  },

  // Admin-triggered unlock (no token needed)
  async adminUnlockAccount(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ValidationError("User not found");
    await userRepository.unlockAccount(userId);
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
    }

    return { message: "If that email is registered, a reset link has been sent." };
  },

  async resetPassword(dto: ResetPasswordDto) {
    const user = await userRepository.findByResetToken(hashToken(dto.token));
    if (!user) {
      throw new ValidationError("Invalid or expired reset link");
    }

    assertPasswordStrength(dto.password, [user.fullname, user.email]);
    await assertNoPasswordReuse(dto.password, user.password, user.passwordHistory);

    const newHash = await hashPassword(dto.password);
    const updatedHistory = buildPasswordHistoryUpdate(user.password, user.passwordChangedAt, user.passwordHistory);

    await userRepository.updatePassword(user.id, newHash, updatedHistory);

    return { message: "Password reset successful. You can now log in with your new password." };
  },
};