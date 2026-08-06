import crypto from "crypto";
import config from "../config/config.js";

export const OTP_TTL_SECONDS = 300;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtpCode(phone: string, code: string): string {
  return crypto
    .createHmac("sha256", config.otpHashSecret)
    .update(`${phone}:${code}`)
    .digest("hex");
}

/** Convert 10-digit VN phone (0xxxxxxxxx) to ZNS format 84xxxxxxxxx */
export function toZnsPhone(phone: string): string {
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("Phone must be a 10-digit number");
  }
  if (phone.startsWith("0")) {
    return `84${phone.slice(1)}`;
  }
  return `84${phone}`;
}
