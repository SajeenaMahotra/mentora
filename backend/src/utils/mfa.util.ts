import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

const APP_NAME = "Mentora";

export function generateSecret(email: string) {
  return speakeasy.generateSecret({
    name: `${APP_NAME} (${email})`,
    length: 20,
  });
}

export function generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTotp(base32Secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: "base32",
    token,
    window: 1, // allow 30s clock drift
  });
}

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString("hex")); // 10-char codes
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}