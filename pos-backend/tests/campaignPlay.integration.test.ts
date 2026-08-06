// @ts-nocheck
/**
 * Integration tests: public campaign play and lookup APIs.
 *
 * Run:
 *   cd pos-backend && npm run test:integration -- --testPathPatterns=campaignPlay
 */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import Campaign from "../models/campaignModel.js";
import CampaignParticipation from "../models/campaignParticipationModel.js";
import CampaignVoucher from "../models/campaignVoucherModel.js";
import Customer from "../models/customerModel.js";
import "../models/userModel.js";
import campaignRoute from "../routes/campaignRoute.js";
import globalErrorHandler from "../middlewares/globalErrorHandler.js";

const app = express();
app.use(express.json());
app.use("/api/campaign", campaignRoute);
app.use(globalErrorHandler);

const WIN_SLOT = {
  label: "10% Off",
  rewardType: "percentage_discount",
  discountPercent: 10,
  weight: 1,
  color: "#4CAF50",
};

const LOSE_SLOT = {
  label: "Try Again",
  rewardType: "no_prize",
  weight: 1,
  color: "#9E9E9E",
};

function mockSpinToFirstSlot() {
  jest.spyOn(Math, "random").mockReturnValue(0);
}

async function createTestCampaign(overrides = {}) {
  const userId = new mongoose.Types.ObjectId();
  return Campaign.create({
    name: "Summer Spin",
    slug: "summer-spin",
    description: "Spin to win rewards",
    isActive: true,
    maxPlaysPerPhone: 1,
    wheelSlots: [WIN_SLOT, LOSE_SLOT],
    createdBy: userId,
    ...overrides,
  });
}

async function ensureVerifiedPhone(phone) {
  await Customer.findOneAndUpdate(
    { phone },
    {
      $set: { phoneVerifiedAt: new Date() },
      $setOnInsert: { name: "" },
    },
    { upsert: true }
  );
}

describe("Integration — Campaign play API", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("play rejects unverified phone", async () => {
    await createTestCampaign();

    const res = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234500" })
      .expect(403);

    expect(res.body.message).toMatch(/not verified/i);
  });

  test("play returns win and creates voucher", async () => {
    await createTestCampaign();
    await ensureVerifiedPhone("0901234567");
    mockSpinToFirstSlot();

    const res = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234567" })
      .expect(200);

    expect(res.body.result).toBe("win");
    expect(res.body.reward.label).toBe("10% Off");
    expect(res.body.reward.type).toBe("percentage_discount");
    expect(res.body.reward.discountPercent).toBe(10);
    expect(res.body.voucher.code).toMatch(/^HK-[A-Z0-9]{6}$/);
    expect(res.body.voucher.qrToken).toBeTruthy();
    expect(res.body.playsRemaining).toBe(0);

    const voucherCount = await CampaignVoucher.countDocuments();
    expect(voucherCount).toBe(1);

    const customer = await Customer.findOne({ phone: "0901234567" });
    expect(customer).toBeTruthy();
  });

  test("play returns lose for no_prize slot", async () => {
    await createTestCampaign({
      maxPlaysPerPhone: 2,
      wheelSlots: [LOSE_SLOT, WIN_SLOT],
    });
    await ensureVerifiedPhone("0901234568");
    mockSpinToFirstSlot();

    const res = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234568" })
      .expect(200);

    expect(res.body.result).toBe("lose");
    expect(res.body.message).toBe("Try again next time");
    expect(res.body.playsRemaining).toBe(1);

    const voucherCount = await CampaignVoucher.countDocuments();
    expect(voucherCount).toBe(0);
  });

  test("play returns no_plays_remaining after max plays used", async () => {
    await createTestCampaign({ wheelSlots: [LOSE_SLOT, WIN_SLOT] });
    await ensureVerifiedPhone("0901234569");
    mockSpinToFirstSlot();

    await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234569" })
      .expect(200);

    const res = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234569" })
      .expect(200);

    expect(res.body.result).toBe("no_plays_remaining");
    expect(res.body.message).toBe("You have already played");

    const participation = await CampaignParticipation.findOne({
      phone: "0901234569",
    });
    expect(participation.playCount).toBe(1);
  });

  test("play returns existing win when max plays reached but active voucher exists", async () => {
    await createTestCampaign();
    await ensureVerifiedPhone("0901234570");
    mockSpinToFirstSlot();

    const first = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234570" })
      .expect(200);

    expect(first.body.result).toBe("win");

    const second = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234570" })
      .expect(200);

    expect(second.body.result).toBe("win");
    expect(second.body.voucher.code).toBe(first.body.voucher.code);
    expect(second.body.playsRemaining).toBe(0);
  });

  test("play rejects ended campaign", async () => {
    await createTestCampaign({
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    await ensureVerifiedPhone("0901234571");

    const res = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234571" })
      .expect(400);

    expect(res.body.message).toBe("Campaign has ended");
  });

  test("lookup returns active voucher", async () => {
    await createTestCampaign();
    await ensureVerifiedPhone("0901234572");
    mockSpinToFirstSlot();

    const playRes = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "0901234572" })
      .expect(200);

    const lookupRes = await request(app)
      .post("/api/campaign/summer-spin/lookup")
      .send({ phone: "0901234572" })
      .expect(200);

    expect(lookupRes.body.status).toBe("active");
    expect(lookupRes.body.voucher.code).toBe(playRes.body.voucher.code);
    expect(lookupRes.body.reward.label).toBe("10% Off");
  });

  test("get public campaign hides weights", async () => {
    await createTestCampaign();

    const res = await request(app)
      .get("/api/campaign/summer-spin/public")
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Summer Spin");
    expect(res.body.data.description).toBe("Spin to win rewards");
    expect(res.body.data.wheelSlots).toEqual([
      { label: "10% Off", color: "#4CAF50" },
      { label: "Try Again", color: "#9E9E9E" },
    ]);
    expect(res.body.data.wheelSlots[0].weight).toBeUndefined();
  });

  test("play rejects invalid phone", async () => {
    await createTestCampaign();

    const res = await request(app)
      .post("/api/campaign/summer-spin/play")
      .send({ phone: "123" })
      .expect(400);

    expect(res.body.message).toMatch(/10-digit/i);
  });

  test("lookup works without phone verification", async () => {
    await createTestCampaign();

    const res = await request(app)
      .post("/api/campaign/summer-spin/lookup")
      .send({ phone: "0901234599" })
      .expect(200);

    expect(res.body.status).toBe("none");
  });
});
