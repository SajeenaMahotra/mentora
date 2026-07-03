import User, { IUser } from "../models/user.model";

export const userRepository = {
  findByEmail(email: string) {
    return User.findOne({ email });
  },

  findByEmailWithPassword(email: string) {
    return User.findOne({ email }).select("+password +failedLoginAttempts +lockedUntil");
  },

  findById(id: string) {
    return User.findById(id);
  },

  findByIdWithMfaSecret(id: string) {
    return User.findById(id).select("+mfaSecret +mfaRecoveryCodes");
  },

  setMfaSecret(id: string, encryptedSecret: string) {
    return User.findByIdAndUpdate(id, { mfaSecret: encryptedSecret }, { new: true });
  },

  enableMfa(id: string, recoveryCodeHashes: string[]) {
    return User.findByIdAndUpdate(
      id,
      {
        mfaEnabled: true,
        mfaRecoveryCodes: recoveryCodeHashes.map((codeHash) => ({ codeHash, used: false })),
      },
      { new: true }
    );
  },

  markRecoveryCodeUsed(id: string, codeHash: string) {
    return User.updateOne(
      { _id: id, "mfaRecoveryCodes.codeHash": codeHash },
      { $set: { "mfaRecoveryCodes.$.used": true } }
    );
  },

  incrementFailedAttempts(id: string) {
    return User.findByIdAndUpdate(id, { $inc: { failedLoginAttempts: 1 } }, { new: true }).select(
      "+failedLoginAttempts +lockedUntil"
    );
  },

  resetFailedAttempts(id: string) {
    return User.findByIdAndUpdate(id, {
      failedLoginAttempts: 0,
      $unset: { lockedUntil: 1, unlockTokenHash: 1, unlockTokenExpires: 1 },
    });
  },

  lockAccount(id: string, unlockTokenHash: string, unlockTokenExpires: Date) {
    return User.findByIdAndUpdate(id, {
      lockedUntil: new Date("9999-12-31"), // indefinite — cleared only via unlock token or admin
      unlockTokenHash,
      unlockTokenExpires,
    });
  },

  findByUnlockToken(tokenHash: string) {
    return User.findOne({
      unlockTokenHash: tokenHash,
      unlockTokenExpires: { $gt: new Date() },
    }).select("+unlockTokenHash +unlockTokenExpires +lockedUntil +failedLoginAttempts");
  },

  unlockAccount(id: string) {
    return User.findByIdAndUpdate(id, {
      failedLoginAttempts: 0,
      $unset: { lockedUntil: 1, unlockTokenHash: 1, unlockTokenExpires: 1 },
    });
  },

  setResetPasswordToken(id: string, tokenHash: string, expires: Date) {
    return User.findByIdAndUpdate(id, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: expires,
    });
  },

  findByResetToken(tokenHash: string) {
    return User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires +password +passwordHistory");
  },

  updatePassword(id: string, newHash: string, updatedHistory: { hash: string; changedAt: Date }[]) {
    return User.findByIdAndUpdate(id, {
      password: newHash,
      passwordChangedAt: new Date(),
      passwordHistory: updatedHistory,
      failedLoginAttempts: 0,
      $unset: {
        lockedUntil: 1,
        unlockTokenHash: 1,
        unlockTokenExpires: 1,
        resetPasswordTokenHash: 1,
        resetPasswordExpires: 1,
      },
    });
  },

  updateProfile(id: string, data: Partial<Pick<IUser, "fullname" | "bio">>) {
    return User.findByIdAndUpdate(id, data, { new: true });
  },

  create(data: Partial<IUser>) {
    return User.create(data);
  },

  updateProfilePhoto(id: string, filename: string) {
    return User.findByIdAndUpdate(id, { profilePhoto: filename }, { new: true });
  },

  findByIdWithPassword(id: string) {
    return User.findById(id).select("+password +passwordHistory +passwordChangedAt");
  },

  findByIdWithPasswordAndEmail(id: string) {
    return User.findById(id).select("+password");
  },

  updateEmail(id: string, newEmail: string, tokenHash: string, expires: Date) {
    return User.findByIdAndUpdate(id, {
      email: newEmail,
      emailVerified: false,
      emailVerifyTokenHash: tokenHash,
      emailVerifyExpires: expires,
    });
  },

  findByEmailVerifyToken(tokenHash: string) {
    return User.findOne({
      emailVerifyTokenHash: tokenHash,
      emailVerifyExpires: { $gt: new Date() },
    }).select("+emailVerifyTokenHash +emailVerifyExpires");
  },

  verifyEmail(id: string) {
    return User.findByIdAndUpdate(id, {
      emailVerified: true,
      $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 },
    });
  },

  setProfileSetup(id: string, value: boolean) {
    return User.findByIdAndUpdate(id, { isProfileSetup: value }, { new: true });
  },

  updateSubjects(id: string, subjectIds: string[]) {
    return User.findByIdAndUpdate(id, { subjects: subjectIds }, { new: true });
  },
};