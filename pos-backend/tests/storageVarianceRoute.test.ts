import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";
import storageVarianceRoute from "../routes/storageVarianceRoute.js";
import globalErrorHandler from "../middlewares/globalErrorHandler.js";
import { userRoles } from "../constants/user.js";

const app = express();
app.use(express.json());
app.use("/api/storage/variance", storageVarianceRoute);
app.use(globalErrorHandler);

describe("GET /api/storage/variance", () => {
  let currentStoreId = "";

  beforeEach(async () => {
    const store = await Store.create({
      name: "Variance Store",
      code: `VS${Date.now()}`,
      isActive: true,
    });
    currentStoreId = String(store._id);
  });

  async function authAs(role: string) {
    const user = await User.create({
      name: "Tester",
      phone: String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)),
      password: "password123",
      role,
    });
    jest.spyOn(jwt, "verify").mockReturnValue({ _id: user._id } as never);
    return user;
  }

  it("returns 403 for a non-admin", async () => {
    await authAs(userRoles.USER);
    const res = await request(app)
      .get("/api/storage/variance")
      .set("Authorization", "Bearer test-token")
      .set("x-store-id", currentStoreId);
    expect(res.status).toBe(403);
  });

  it("returns 200 for an admin", async () => {
    await authAs(userRoles.ADMIN);
    const res = await request(app)
      .get("/api/storage/variance?scope=all")
      .set("Authorization", "Bearer test-token")
      .set("x-store-id", currentStoreId);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });
});
