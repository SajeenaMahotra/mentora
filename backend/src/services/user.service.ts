import { ChangePasswordDto, UpdateProfileDto, ChangeEmailDto, VerifyEmailDto, ImportDataDto } from "../dtos/user.dto";
import { userRepository } from "../repositories/user.repository";
import { UnauthorizedError, ValidationError, ConflictError, ForbiddenError } from "../errors/AppError";
import {
  assertPasswordStrength,
  hashPassword,
  comparePassword,
  assertNoPasswordReuse,
  buildPasswordHistoryUpdate,
} from "../utils/password.util";
import { packageRepository } from "../repositories/package.repository";
import { bookingRepository } from "../repositories/booking.repository";
import { reviewRepository } from "../repositories/review.repository";
import Category from "../models/category.model";
import { generateToken, hashToken } from "../utils/token.util";
import { sendMail } from "../utils/mailer.util";
import fs from "fs";
import path from "path";
import { env } from "../config/env";
import { auditLogService } from "./audit-log.service";

const EMAIL_VERIFY_TTL_MS = 60 * 60 * 1000;

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile-photos");

function toProfileResponse(user: any) {
  return {
    id: user.id,
    fullname: user.fullname,
    email: user.email,
    role: user.role,
    status: user.status,
    bio: user.bio ?? null,
    profilePhoto: user.profilePhoto ?? null,
    isProfileSetup: user.isProfileSetup,
    subjects: user.subjects,
    averageRating: user.averageRating,
    ratingCount: user.ratingCount,
    emailVerified: user.emailVerified,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
  };
}

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ValidationError("User not found");
    return toProfileResponse(user);
  },

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await userRepository.updateProfile(userId, dto);
    if (!user) throw new ValidationError("User not found");
    return toProfileResponse(user);
  },

  async updateProfilePhoto(userId: string, filename: string) {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new ValidationError("User not found");

    const oldPhoto = existing.profilePhoto;

    const user = await userRepository.updateProfilePhoto(userId, filename);

    // best-effort cleanup of old file — don't fail the request if this errors
    if (oldPhoto) {
      const oldPath = path.join(UPLOAD_DIR, oldPhoto);
      fs.unlink(oldPath, () => {});
    }

    return toProfileResponse(user);
  },

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw new ValidationError("User not found");

    const currentMatches = await comparePassword(dto.currentPassword, user.password);
    if (!currentMatches) throw new UnauthorizedError("Current password is incorrect");

    assertPasswordStrength(dto.password, [user.fullname, user.email]);
    await assertNoPasswordReuse(dto.password, user.password, user.passwordHistory);

    const newHash = await hashPassword(dto.password);
    const updatedHistory = buildPasswordHistoryUpdate(user.password, user.passwordChangedAt, user.passwordHistory);

    await userRepository.updatePassword(userId, newHash, updatedHistory);

    return { message: "Password changed successfully." };
  },

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await userRepository.findByIdWithPasswordAndEmail(userId);
    if (!user) throw new ValidationError("User not found");

    const passwordMatches = await comparePassword(dto.currentPassword, user.password);
    if (!passwordMatches) throw new UnauthorizedError("Current password is incorrect");

    if (dto.newEmail === user.email) {
      throw new ValidationError("New email must be different from current email");
    }

    const existing = await userRepository.findByEmail(dto.newEmail);
    if (existing) throw new ConflictError("Email already in use");

    const { token, tokenHash } = generateToken();
    await userRepository.updateEmail(userId, dto.newEmail, tokenHash, new Date(Date.now() + EMAIL_VERIFY_TTL_MS));

    await sendMail(
      dto.newEmail,
      "Verify your new Mentora email",
      `Confirm your new email here: ${env.CLIENT_URL}/verify-email?token=${token}\n` +
        `This link expires in 1 hour.`
    );

    return { message: "Email updated. Please check your new inbox to verify it." };
  },

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await userRepository.findByEmailVerifyToken(hashToken(dto.token));
    if (!user) throw new ValidationError("Invalid or expired verification link");

    await userRepository.verifyEmail(user.id);

    return { message: "Email verified successfully." };
  },

  async checkAndUpdateProfileSetup(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ValidationError("User not found");

    if (user.role !== "mentor" || user.isProfileSetup) return;

    const hasBio = !!user.bio && user.bio.trim().length > 0;
    const hasSubject = user.subjects.length >= 1;
    const packageCount = await packageRepository.countByMentor(userId);
    const hasPackage = packageCount >= 1;

    if (hasBio && hasSubject && hasPackage) {
      await userRepository.setProfileSetup(userId, true);
    }
  },

  async updateSubjects(userId: string, subjectIds: string[]) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ValidationError("User not found");
    if (user.role !== "mentor") throw new ForbiddenError("Only mentors can set subjects");

    const count = await Category.countDocuments({ _id: { $in: subjectIds } });
    if (count !== subjectIds.length) throw new ValidationError("One or more subjects are invalid");

    await userRepository.updateSubjects(userId, subjectIds);
    await this.checkAndUpdateProfileSetup(userId);

    return this.getProfile(userId);
  },

  // --- NEW: privacy/data-portability export (GDPR Art. 20 style). Returns everything meaningfully
  // "owned" by this user — profile, their bookings (as learner or mentor), and reviews they wrote.
  // Messages are deliberately excluded since a conversation also contains another person's data,
  // which can't be unilaterally exported by one participant.
  async exportUserData(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ValidationError("User not found");

    const [bookings, reviewsWritten] = await Promise.all([
      bookingRepository.findAllForExport(userId, user.role === "mentor" ? "mentor" : "learner"),
      reviewRepository.findAllByLearnerForExport(userId),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        bio: user.bio ?? null,
        isProfileSetup: user.isProfileSetup,
        averageRating: user.averageRating,
        ratingCount: user.ratingCount,
        createdAt: user.createdAt,
      },
      bookings: bookings.map((b: any) => ({
        title: b.packageTitle,
        price: b.packagePrice,
        sessionType: b.sessionType,
        status: b.status,
        createdAt: b.createdAt,
        completedAt: b.completedAt ?? null,
      })),
      reviewsWritten: reviewsWritten.map((r: any) => ({
        mentor: r.mentor?.fullname ?? "Unknown",
        rating: r.rating,
        comment: r.comment ?? null,
        createdAt: r.createdAt,
      })),
    };
  },

   async importUserData(userId: string, dto: ImportDataDto) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ValidationError("User not found");

    const updates: UpdateProfileDto = {};
    if (dto.profile.fullname !== undefined) updates.fullname = dto.profile.fullname;
    if (dto.profile.bio !== undefined) updates.bio = dto.profile.bio;

    const updated = await userRepository.updateProfile(userId, updates);
    if (!updated) throw new ValidationError("User not found");

    await auditLogService.log({
      actor: userId,
      action: "DATA_IMPORTED",
      metadata: { fields: Object.keys(updates) },
    });

    if (user.role === "mentor") {
      await this.checkAndUpdateProfileSetup(userId);
    }

    return toProfileResponse(updated);
  },
};