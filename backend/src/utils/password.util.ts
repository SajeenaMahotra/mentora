import bcrypt from "bcrypt";
import zxcvbn from "zxcvbn";
import { ValidationError } from "../errors/AppError";

const BCRYPT_COST = 12;
const MIN_ZXCVBN_SCORE = 3; // 0-4 scale, require "strong"

export function assertPasswordStrength(password: string, userInputs: string[] = []): void {
  const result = zxcvbn(password, userInputs);
  if (result.score < MIN_ZXCVBN_SCORE) {
    const suggestion = result.feedback.suggestions[0] ?? "Use a longer, less predictable password.";
    throw new ValidationError(`Password too weak: ${suggestion}`);
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}