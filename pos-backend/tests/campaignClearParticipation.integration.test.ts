// @ts-nocheck
/**
 * Integration tests: admin clear campaign participation.
 *
 * Run:
 *   cd pos-backend && npm run test:integration -- --testPathPatterns=campaignClearParticipation
 */
import { beforeEach, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import Campaign from "../models/campaignModel.js";
import CampaignParticipation from "../models/campaignParticipationModel.js";
import CampaignVoucher from "../models/campaignVoucherModel.js";
import { CampaignService } from "../services/campaignService.js";
import { generateQrToken, generateVoucherCode } from "../utils/campaignUtils.js";

describe("CampaignService.clearParticipation", () => {
  beforeEach(async () => {
    await Campaign.deleteMany({});
    await CampaignParticipation.deleteMany({});
    await CampaignVoucher.deleteMany({});
  });

  test("deletes participation and expires active voucher", async () => {
    const adminId = new mongoose.Types.ObjectId();
    const campaign = await Campaign.create({
      name: "Clear Test",
      slug: `clear-test-${Date.now()}`,
      isActive: true,
      maxPlaysPerPhone: 1,
      wheelSlots: [
        {
          label: "10% Off",
          rewardType: "percentage_discount",
          discountPercent: 10,
          weight: 1,
          color: "#4CAF50",
        },
        {
          label: "Try Again",
          rewardType: "no_prize",
          weight: 1,
          color: "#9E9E9E",
        },
      ],
      createdBy: adminId,
    });

    const participation = await CampaignParticipation.create({
      campaign: campaign._id,
      phone: "0912345678",
      playCount: 1,
      lastPlayedAt: new Date(),
    });

    const voucher = await CampaignVoucher.create({
      campaign: campaign._id,
      participation: participation._id,
      voucherCode: generateVoucherCode(),
      qrToken: generateQrToken(),
      rewardType: "percentage_discount",
      discountPercent: 10,
      rewardLabel: "10% Off",
      status: "active",
      wonAt: new Date(),
    });

    await CampaignService.clearParticipation(String(participation._id));

    expect(await CampaignParticipation.findById(participation._id)).toBeNull();

    const updatedVoucher = await CampaignVoucher.findById(voucher._id);
    expect(updatedVoucher?.status).toBe("expired");
  });

  test("throws 404 for invalid participation id", async () => {
    await expect(
      CampaignService.clearParticipation(new mongoose.Types.ObjectId().toString())
    ).rejects.toMatchObject({ status: 404 });
  });
});
