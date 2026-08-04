import crypto from "crypto";
import type { WheelSlot } from "../types/campaign.js";

export function pickWeightedSlot(slots: WheelSlot[]): WheelSlot {
  const total = slots.reduce((sum, s) => sum + s.weight, 0);
  let r = Math.random() * total;
  for (const slot of slots) {
    r -= slot.weight;
    if (r <= 0) return slot;
  }
  return slots[slots.length - 1];
}

export function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HK-";
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

export function generateQrToken(): string {
  return crypto.randomUUID();
}

export function maskPhone(phone: string): string {
  if (phone.length !== 10) return phone;
  return `${phone.slice(0, 2)}****${phone.slice(-4)}`;
}
