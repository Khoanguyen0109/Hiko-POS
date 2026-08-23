import { beforeEach, describe, expect, it } from "@jest/globals";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import { getStorageVariance } from "../controllers/storageVarianceController.js";
import { isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
import globalErrorHandler from "../middlewares/globalErrorHandler.js";
import { userRoles } from "../constants/user.js";

const app = express();
app.use(express.json());

let currentRole = userRoles.USER;
let currentStoreId = "";

app.use((req, _res, next) => {
  req.user = {
    _id: new mongoose.Types.ObjectId(),
    name: "Tester",
    role: currentRole,
  };
  next();
});

app.get("/api/storage/variance", storeContext, isAdmin, getStorageVariance);
app.use(globalErrorHandler);

describe("GET /api/storage/variance", () => {
  beforeEach(async () => {
    const store = await Store.create({
      name: "Variance Store",
      code: `VS${Date.now()}`,
      isActive: true,
    });
    currentStoreId = String(store._id);
  });

  it("returns 403 for a non-admin", async () => {
    currentRole = userRoles.USER;
    const res = await request(app)
      .get("/api/storage/variance")
      .set("x-store-id", currentStoreId);
    expect(res.status).toBe(403);
  });

  it("returns 200 for an admin", async () => {
    currentRole = userRoles.ADMIN;
    const res = await request(app)
      .get("/api/storage/variance?scope=all")
      .set("x-store-id", currentStoreId);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });
});
