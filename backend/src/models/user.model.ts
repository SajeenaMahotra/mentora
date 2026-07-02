import { Schema, model, Document } from "mongoose";
import { UserRole, PasswordHistoryEntry, MfaBackupCode } from "../types/user.type";

export type AccountStatus = "active" | "suspended" | "banned";

export interface IUser extends Document {
  fullname: string;
  email: string;
  password: string;
  role: UserRole;
  status: AccountStatus;

  // profile
  bio?: string;
  profilePhoto?: string; // filename only, served via /uploads/
  isProfileSetup: boolean;

  // mentor-only
  subjects: Schema.Types.ObjectId[]; // category IDs
  averageRating: number;
  ratingCount: number;

  // security
  failedLoginAttempts: number;
  lockedUntil?: Date;
  unlockTokenHash?: string;
  unlockTokenExpires?: Date;
  passwordChangedAt: Date;
  passwordHistory: PasswordHistoryEntry[];
  mfaEnabled: boolean;
  mfaSecret?: string; // encrypted
  mfaRecoveryCodes: MfaBackupCode[];
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  emailVerified: boolean;
  emailVerifyTokenHash?: string;
  emailVerifyExpires?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullname: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["learner", "mentor", "admin"], default: "learner" },
    status: { type: String, enum: ["active", "suspended", "banned"], default: "active" },

    bio: { type: String, maxlength: 1000 },
    profilePhoto: { type: String },
    isProfileSetup: { type: Boolean, default: false },

    subjects: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },
    unlockTokenHash: { type: String, select: false },
    unlockTokenExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, default: Date.now, select: false },
    passwordHistory: {
      type: [{ hash: { type: String, required: true }, changedAt: { type: Date, required: true } }],
      default: [],
      select: false,
    },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    mfaRecoveryCodes: {
      type: [{ codeHash: { type: String, required: true }, used: { type: Boolean, default: false } }],
      default: [],
      select: false,
    },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    emailVerified: { type: Boolean, default: false },

    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ subjects: 1 });

export default model<IUser>("User", userSchema);