export type UserRole = "learner" | "mentor" | "admin";

export interface PasswordHistoryEntry {
  hash: string;
  changedAt: Date;
}

export interface MfaBackupCode {
  codeHash: string;
  used: boolean;
}