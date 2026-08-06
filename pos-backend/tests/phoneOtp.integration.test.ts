// @ts-nocheck
/**
 * Integration tests: campaign phone OTP send/verify.
 *
 * Run:
 *   cd pos-backend && npm run test:integration -- --testPathPatterns=phoneOtp
 */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import Campaign from "../models/campaignModel.js";
import Customer from "../models/customerModel.js";
import PhoneOtpChallenge from "../models/phoneOtpChallengeModel.js";
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

async function createTestCampaign(overrides = {}) {
  const userId = new mongoose.Types.ObjectId();
  return Campaign.create({
    name: "OTP Spin",
    slug: "otp-spin",
    description: "OTP campaign",
    isActive: true,
    maxPlaysPerPhone: 1,
    wheelSlots: [WIN_SLOT, LOSE_SLOT],
    createdBy: userId,
    ...overrides,
  });
}

describe("Integration — Campaign phone OTP", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("send OTP creates challenge and verify marks customer verified", async () => {
    await createTestCampaign();

    const sendRes = await request(app)
      .post("/api/campaign/otp-spin/otp/send")
      .send({ phone: "0911111111" })
      .expect(200);

    expect(sendRes.body.success).toBe(true);
    expect(sendRes.body.alreadyVerified).toBe(false);
    expect(sendRes.body.expiresInSeconds).toBe(300);

    const challenge = await PhoneOtpChallenge.findOne({ phone: "0911111111" });
    expect(challenge).toBeTruthy();

    const verifyRes = await request(app)
      .post("/api/campaign/otp-spin/otp/verify")
      .send({ phone: "0911111111", otp: "000000" })
      .expect(200);

    expect(verifyRes.body.verified).toBe(true);

    const customer = await Customer.findOne({ phone: "0911111111" });
    expect(customer.phoneVerifiedAt).toBeTruthy();
    expect(await PhoneOtpChallenge.findOne({ phone: "0911111111" })).toBeNull();
  });

  test("send returns alreadyVerified when phone was verified before", async () => {
    await createTestCampaign();
    await Customer.create({
      phone: "0911111112",
      name: "",
      phoneVerifiedAt: new Date(),
    });

    const sendRes = await request(app)
      .post("/api/campaign/otp-spin/otp/send")
      .send({ phone: "0911111112" })
      .expect(200);

    expect(sendRes.body.alreadyVerified).toBe(true);
    expect(await PhoneOtpChallenge.findOne({ phone: "0911111112" })).toBeNull();
  });

  test("verify rejects wrong OTP", async () => {
    await createTestCampaign();

    await request(app)
      .post("/api/campaign/otp-spin/otp/send")
      .send({ phone: "0911111113" })
      .expect(200);

    const res = await request(app)
      .post("/api/campaign/otp-spin/otp/verify")
      .send({ phone: "0911111113", otp: "111111" })
      .expect(400);

    expect(res.body.message).toMatch(/incorrect/i);
  });

  test("after verify, play succeeds", async () => {
    await createTestCampaign();
    jest.spyOn(Math, "random").mockReturnValue(0);

    await request(app)
      .post("/api/campaign/otp-spin/otp/send")
      .send({ phone: "0911111114" })
      .expect(200);

    await request(app)
      .post("/api/campaign/otp-spin/otp/verify")
      .send({ phone: "0911111114", otp: "000000" })
      .expect(200);

    const playRes = await request(app)
      .post("/api/campaign/otp-spin/play")
      .send({ phone: "0911111114" })
      .expect(200);

    expect(playRes.body.result).toBe("win");
  });
});
