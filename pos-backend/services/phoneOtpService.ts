import createHttpError from "http-errors";
import config from "../config/config.js";
import Customer from "../models/customerModel.js";
import PhoneOtpChallenge from "../models/phoneOtpChallengeModel.js";
import { CampaignService } from "./campaignService.js";
import { ZaloZnsService } from "./zaloZnsService.js";
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  generateOtpCode,
  hashOtpCode,
} from "../utils/phoneOtpUtils.js";

/** Deterministic code when ZNS is dry-run (tests / local without Zalo). */
const DRY_RUN_OTP = "000000";

export interface OtpSendResult {
  success: true;
  alreadyVerified: boolean;
  expiresInSeconds?: number;
}

export interface OtpVerifyResult {
  success: true;
  verified: true;
}

function validatePhone(phone: string): void {
  if (!/^\d{10}$/.test(phone)) {
    throw createHttpError(400, "Phone number must be a 10-digit number");
  }
}

async function assertCampaignPlayable(slug: string): Promise<void> {
  const campaign = await CampaignService.getCampaignBySlug(slug);
  if (!campaign) {
    throw createHttpError(404, "Campaign not found");
  }
  const playable = CampaignService.isCampaignPlayable(campaign);
  if (!playable.ok) {
    throw createHttpError(400, playable.reason ?? "Campaign is not playable");
  }
}

export class PhoneOtpService {
  static async sendOtp(slug: string, phone: string): Promise<OtpSendResult> {
    validatePhone(phone);
    await assertCampaignPlayable(slug);

    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({ phone, name: "" });
    }

    if (customer.phoneVerifiedAt) {
      return { success: true, alreadyVerified: true };
    }

    const existing = await PhoneOtpChallenge.findOne({ phone });
    if (existing) {
      const elapsedMs = Date.now() - existing.lastSentAt.getTime();
      if (elapsedMs < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
        const waitSec = Math.ceil(
          (OTP_RESEND_COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000
        );
        throw createHttpError(
          429,
          `Please wait ${waitSec}s before requesting another code`
        );
      }
    }

    const code = config.znsOtpDryRun ? DRY_RUN_OTP : generateOtpCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);

    await PhoneOtpChallenge.findOneAndUpdate(
      { phone },
      {
        $set: {
          codeHash: hashOtpCode(phone, code),
          expiresAt,
          attemptCount: 0,
          lastSentAt: now,
        },
      },
      { upsert: true, new: true }
    );

    try {
      await ZaloZnsService.sendOtp(phone, code);
    } catch (error) {
      await PhoneOtpChallenge.deleteOne({ phone });
      throw error;
    }

    return {
      success: true,
      alreadyVerified: false,
      expiresInSeconds: OTP_TTL_SECONDS,
    };
  }

  static async verifyOtp(
    slug: string,
    phone: string,
    otp: string
  ): Promise<OtpVerifyResult> {
    validatePhone(phone);
    await assertCampaignPlayable(slug);

    const normalizedOtp = String(otp || "").trim();
    if (!/^\d{6}$/.test(normalizedOtp)) {
      throw createHttpError(400, "OTP must be a 6-digit code");
    }

    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({ phone, name: "" });
    }

    if (customer.phoneVerifiedAt) {
      return { success: true, verified: true };
    }

    const challenge = await PhoneOtpChallenge.findOne({ phone });
    if (!challenge) {
      throw createHttpError(400, "OTP expired or not requested. Please send a new code.");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      await PhoneOtpChallenge.deleteOne({ phone });
      throw createHttpError(400, "OTP expired. Please send a new code.");
    }

    if (challenge.attemptCount >= OTP_MAX_ATTEMPTS) {
      await PhoneOtpChallenge.deleteOne({ phone });
      throw createHttpError(
        429,
        "Too many incorrect attempts. Please send a new code."
      );
    }

    const expectedHash = hashOtpCode(phone, normalizedOtp);
    if (expectedHash !== challenge.codeHash) {
      challenge.attemptCount += 1;
      await challenge.save();

      if (challenge.attemptCount >= OTP_MAX_ATTEMPTS) {
        await PhoneOtpChallenge.deleteOne({ phone });
        throw createHttpError(
          429,
          "Too many incorrect attempts. Please send a new code."
        );
      }

      throw createHttpError(400, "Incorrect OTP code");
    }

    customer.phoneVerifiedAt = new Date();
    await customer.save();
    await PhoneOtpChallenge.deleteOne({ phone });

    return { success: true, verified: true };
  }
}
