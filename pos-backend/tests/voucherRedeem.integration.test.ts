// @ts-nocheck
/**
 * Integration tests: voucher validate and redeem.
 *
 * Run:
 *   cd pos-backend && npm run test:integration -- --testPathPatterns=voucherRedeem
 */
import { beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import Campaign from "../models/campaignModel.js";
import CampaignParticipation from "../models/campaignParticipationModel.js";
import CampaignVoucher from "../models/campaignVoucherModel.js";
import Store from "../models/storeModel.js";
import "../models/userModel.js";
import {
  validateVoucher,
  redeemVoucher,
} from "../controllers/voucherController.js";
import globalErrorHandler from "../middlewares/globalErrorHandler.js";
import { generateQrToken, generateVoucherCode } from "../utils/campaignUtils.js";

const app = express();
app.use(express.json());

let testStoreId;
let testUserId;

app.use((req, res, next) => {
  req.user = {
    _id: testUserId || new mongoose.Types.ObjectId(),
    name: "Voucher Test Staff",
  };
  req.store = testStoreId
    ? { _id: testStoreId, isActive: true }
    : { _id: new mongoose.Types.ObjectId(), isActive: true };
  next();
});

app.get("/api/voucher/validate/:qrToken", validateVoucher);
app.post("/api/voucher/redeem", redeemVoucher);
app.use(globalErrorHandler);

async function seedActiveVoucher(overrides = {}) {
  const adminId = new mongoose.Types.ObjectId();
  const campaign = await Campaign.create({
    name: "Summer Spin",
    slug: `summer-spin-${Date.now()}`,
    description: "Test campaign",
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

  const qrToken = generateQrToken();
  const voucher = await CampaignVoucher.create({
    campaign: campaign._id,
    participation: participation._id,
    voucherCode: generateVoucherCode(),
    qrToken,
    rewardType: "percentage_discount",
    discountPercent: 10,
    rewardLabel: "10% Off",
    status: "active",
    wonAt: new Date(),
    ...overrides,
  });

  return { campaign, participation, voucher, qrToken };
}

describe("Integration — Voucher validate and redeem", () => {
  beforeEach(async () => {
    testUserId = new mongoose.Types.ObjectId();
    const store = await Store.create({
      name: "Voucher Test Store",
      code: "VT" + Date.now(),
      isActive: true,
    });
    testStoreId = store._id;
  });

  test("validate returns preview for active voucher", async () => {
    const { qrToken } = await seedActiveVoucher();

    const res = await request(app)
      .get(`/api/voucher/validate/${qrToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.status).toBe("active");
    expect(res.body.data.rewardLabel).toBe("10% Off");
    expect(res.body.data.rewardType).toBe("percentage_discount");
    expect(res.body.data.discountPercent).toBe(10);
    expect(res.body.data.voucherCode).toMatch(/^HK-/);
    expect(res.body.data.phone).toBe("0912345678");
    expect(res.body.data.campaignName).toBe("Summer Spin");
  });

  test("redeem marks voucher as redeemed atomically", async () => {
    const { qrToken, voucher } = await seedActiveVoucher();

    const res = await request(app)
      .post("/api/voucher/redeem")
      .send({ qrToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.voucherCode).toBe(voucher.voucherCode);
    expect(res.body.data.rewardLabel).toBe("10% Off");

    const updated = await CampaignVoucher.findById(voucher._id);
    expect(updated.status).toBe("redeemed");
    expect(updated.redeemedBy.toString()).toBe(testUserId.toString());
    expect(updated.redeemedAtStore.toString()).toBe(testStoreId.toString());
    expect(updated.redeemedAt).toBeInstanceOf(Date);
  });

  test("double redeem fails with already redeemed error", async () => {
    const { qrToken } = await seedActiveVoucher();

    await request(app)
      .post("/api/voucher/redeem")
      .send({ qrToken })
      .expect(200);

    const second = await request(app)
      .post("/api/voucher/redeem")
      .send({ qrToken })
      .expect(400);

    expect(second.body.message).toMatch(/already redeemed/i);
  });

  test("validate after redeem shows invalid status", async () => {
    const { qrToken } = await seedActiveVoucher();

    await request(app)
      .post("/api/voucher/redeem")
      .send({ qrToken })
      .expect(200);

    const res = await request(app)
      .get(`/api/voucher/validate/${qrToken}`)
      .expect(200);

    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.status).toBe("redeemed");
  });

  test("validate unknown qrToken returns 404", async () => {
    const res = await request(app)
      .get("/api/voucher/validate/00000000-0000-4000-8000-000000000000")
      .expect(404);

    expect(res.body.message).toMatch(/invalid voucher/i);
  });

  test("redeem expired voucher fails", async () => {
    const qrToken = generateQrToken();
    await seedActiveVoucher({ qrToken, status: "expired" });

    const res = await request(app)
      .post("/api/voucher/redeem")
      .send({ qrToken })
      .expect(400);

    expect(res.body.message).toMatch(/expired/i);
  });

  test("validate inactive campaign marks active voucher as expired", async () => {
    const adminId = new mongoose.Types.ObjectId();
    const campaign = await Campaign.create({
      name: "Ended Campaign",
      slug: `ended-${Date.now()}`,
      isActive: false,
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
      phone: "0987654321",
      playCount: 1,
    });

    const qrToken = generateQrToken();
    await CampaignVoucher.create({
      campaign: campaign._id,
      participation: participation._id,
      voucherCode: generateVoucherCode(),
      qrToken,
      rewardType: "percentage_discount",
      discountPercent: 10,
      rewardLabel: "10% Off",
      status: "active",
    });

    const res = await request(app)
      .get(`/api/voucher/validate/${qrToken}`)
      .expect(200);

    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.status).toBe("expired");
  });
});
