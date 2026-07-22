import User, { AccountStatus, IUser } from "../models/user.model";

interface FindAllParams {
  page: number;
  limit: number;
  role?: string;
  status?: import("../models/user.model").AccountStatus;
  search?: string;
}

export const userRepository = {
  findByEmail(email: string) {
    return User.findOne({ email });
  },

  findByGoogleId(googleId: string) {
    return User.findOne({ googleId }).select("+googleId");
  },

  createGoogleUser(data: { fullname: string; email: string; googleId: string }) {
    return User.create({
      fullname: data.fullname,
      email: data.email,
      googleId: data.googleId,
      provider: "google",
      emailVerified: true, // Google already verified this email for us
    });
  },

  findByEmailWithPassword(email: string) {
    return User.findOne({ email }).select("+password +failedLoginAttempts +lockedUntil +passwordChangedAt");
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

  findAllPaginated({ page, limit, role, status, search }: FindAllParams) {
    const filter: Record<string, any> = { isDeleted: { $ne: true } };
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    return Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]).then(([users, total]) => ({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }));
  },

  updateStatus(id: string, status: AccountStatus) {
    return User.findByIdAndUpdate(id, { status, tokenValidAfter: new Date() }, { new: true });
  },

  updateRole(id: string, role: "learner" | "mentor") {
    return User.findByIdAndUpdate(id, { role }, { new: true });
  },

  softDelete(id: string) {
    return User.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        tokenValidAfter: new Date(),
        fullname: "Deleted User",
        email: `deleted-${id}@mentora.invalid`,
        $unset: { bio: 1, profilePhoto: 1 },
      },
      { new: true }
    );
  },

  disableMfa(id: string) {
    return User.findByIdAndUpdate(id, {
      mfaEnabled: false,
      $unset: { mfaSecret: 1, mfaRecoveryCodes: 1 },
    });
  },

  logout(id: string) {
    return User.findByIdAndUpdate(id, { tokenValidAfter: new Date() });
  },

  setSessionUserAgent(id: string, hash: string) {
    return User.findByIdAndUpdate(id, { sessionUserAgentHash: hash });
  },

  findByIdWithPasswordAndMfa(id: string) {
    return User.findById(id).select("+password +mfaSecret +mfaRecoveryCodes +passwordHistory +passwordChangedAt");
  },

  updateRatingStats(id: string, averageRating: number, ratingCount: number) {
    return User.findByIdAndUpdate(id, { averageRating, ratingCount }, { new: true });
  },


  findAllAdminIds() {
    return User.find({ role: "admin", isDeleted: { $ne: true } }).select("_id").lean();
  },

  resetPasswordWithToken(
    tokenHash: string,
    newHash: string,
    updatedHistory: { hash: string; changedAt: Date }[]
  ) {
    return User.findOneAndUpdate(
      { resetPasswordTokenHash: tokenHash, resetPasswordExpires: { $gt: new Date() } },
      {
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
      },
      { new: true }
    );
  },
};