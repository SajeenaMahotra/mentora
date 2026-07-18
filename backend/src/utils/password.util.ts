import bcrypt from "bcrypt";
import zxcvbn from "zxcvbn";
import { ValidationError } from "../errors/AppError";

const BCRYPT_COST = 12;
const MIN_ZXCVBN_SCORE = 3; // 0-4 scale, 3 = "safely unguessable"
export const PASSWORD_HISTORY_LIMIT = 5;

// Password must contain all four character types.
const COMPOSITION_RULES: [RegExp, string][] = [
  [/[a-z]/, "a lowercase letter"],
  [/[A-Z]/, "an uppercase letter"],
  [/[0-9]/, "a number"],
  [/[^A-Za-z0-9]/, "a special character"],
];

export function assertPasswordStrength(password: string, userInputs: string[] = []): void {
  const missing = COMPOSITION_RULES.filter(([re]) => !re.test(password)).map(([, label]) => label);
  if (missing.length > 0) {
    throw new ValidationError(`Password must contain ${missing.join(", ")}`);
  }

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

export async function assertNoPasswordReuse(
  newPassword: string,
  currentHash: string,
  history: { hash: string; changedAt: Date }[]
): Promise<void> {
  const allPreviousHashes = [currentHash, ...history.map((h) => h.hash)];
  for (const oldHash of allPreviousHashes) {
    if (await comparePassword(newPassword, oldHash)) {
      throw new ValidationError(`New password cannot match any of your last ${PASSWORD_HISTORY_LIMIT} passwords`);
    }
  }
}

export function buildPasswordHistoryUpdate(
  currentHash: string,
  currentChangedAt: Date,
  history: { hash: string; changedAt: Date }[]
): { hash: string; changedAt: Date }[] {
  return [{ hash: currentHash, changedAt: currentChangedAt }, ...history].slice(0, PASSWORD_HISTORY_LIMIT);
}