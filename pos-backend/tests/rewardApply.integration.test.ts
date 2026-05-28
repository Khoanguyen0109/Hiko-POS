// @ts-nocheck
/**
 * Integration tests: apply / remove customer rewards on orders.
 *
 * Run:
 *   cd pos-backend && npm run test:integration -- --testPathPatterns=rewardApply
 *
 * Example flow covered:
 *   1. Create customer with enough dishes to unlock a reward
 *   2. Create order and assign customer
 *   3. PUT /api/order/:id { appliedReward: { rewardProgram, type, discountAmount } }
 *   4. Assert bills.total and bills.rewardDiscount reflect the discount
 */
import { beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Dish from "../models/dishModel.js";
import Category from "../models/categoryModel.js";
import Store from "../models/storeModel.js";
import Customer from "../models/customerModel.js";
import RewardProgram from "../models/rewardProgramModel.js";
import RewardLog from "../models/rewardLogModel.js";
import "../models/userModel.js";
import * as orderController from "../controllers/orderController.js";
import globalErrorHandler from "../middlewares/globalErrorHandler.js";

const app = express();
app.use(express.json());

let testStoreId;
let testUserId;

app.use((req, res, next) => {
  req.user = {
    _id: testUserId || new mongoose.Types.ObjectId(),
    name: "Reward Test Staff",
  };
  req.store = testStoreId
    ? { _id: testStoreId }
    : { _id: new mongoose.Types.ObjectId() };
  next();
});

app.post("/api/order", orderController.addOrder);
app.get("/api/order/:id", orderController.getOrderById);
app.put("/api/order/:id", orderController.updateOrder);
app.use(globalErrorHandler);

function buildOrderPayload(dish, overrides = {}) {
  const subtotal = 81000; // Large 43000 + Medium 38000
  return {
    customerDetails: {
      name: "Reward Test Guest",
      phone: "0900000001",
      guests: 1,
    },
    orderStatus: "progress",
    bills: {
      subtotal,
      promotionDiscount: 0,
      total: subtotal,
      tax: 0,
      totalWithTax: subtotal,
    },
    appliedPromotions: [],
    items: [
      {
        id: "reward-item-large",
        dishId: dish._id,
        name: "Matcha Latte (Large)",
        pricePerQuantity: 43000,
        quantity: 1,
        price: 43000,
        category: "Matcha",
        originalPricePerQuantity: 43000,
        originalPrice: 43000,
        variant: { size: "Large", price: 43000, cost: 15500 },
      },
      {
        id: "reward-item-medium",
        dishId: dish._id,
        name: "Matcha Latte (Medium)",
        pricePerQuantity: 38000,
        quantity: 1,
        price: 38000,
        category: "Matcha",
        originalPricePerQuantity: 38000,
        originalPrice: 38000,
        variant: { size: "Medium", price: 38000, cost: 14000 },
      },
    ],
    thirdPartyVendor: "None",
    ...overrides,
  };
}

describe("Integration — Apply reward to order", () => {
  let testStore;
  let testCategory;
  let testDish;
  let testCustomer;
  let percentageProgram;
  let freeDishProgram;

  beforeEach(async () => {
    testUserId = new mongoose.Types.ObjectId();

    testStore = await Store.create({
      name: "Reward Test Store",
      code: "RW" + Date.now(),
      isActive: true,
    });
    testStoreId = testStore._id;

    testCategory = await Category.create({
      name: "Reward Matcha",
      description: "Category for reward tests",
    });

    testDish = await Dish.create({
      name: "Reward Matcha Latte",
      description: "Test drink",
      category: testCategory._id,
      price: 43000,
      variants: [
        { size: "Medium", price: 38000, cost: 14000 },
        { size: "Large", price: 43000, cost: 15500 },
      ],
      isAvailable: true,
    });

    // Customer already earned rewards (10 dishes, threshold 5 → 2 rewards available)
    testCustomer = await Customer.create({
      phone: "0901234567",
      name: "Loyal Customer",
      totalDishCount: 10,
    });

    percentageProgram = await RewardProgram.create({
      name: "10% Loyalty Discount",
      type: "percentage_discount",
      dishThreshold: 5,
      discountPercent: 10,
      isActive: true,
      priority: 1,
      createdBy: testUserId,
    });

    freeDishProgram = await RewardProgram.create({
      name: "Free Cheapest Dish",
      type: "free_dish",
      dishThreshold: 5,
      isActive: true,
      priority: 2,
      createdBy: testUserId,
    });
  });

  test("apply percentage reward reduces bills.total by 10% of subtotal", async () => {
    const createRes = await request(app)
      .post("/api/order")
      .send(
        buildOrderPayload(testDish, {
          customer: testCustomer._id,
        })
      )
      .expect(201);

    const orderId = createRes.body.data._id;
    const subtotal = createRes.body.data.bills.subtotal;
    expect(subtotal).toBe(81000);
    expect(createRes.body.data.bills.total).toBe(81000);
    expect(createRes.body.data.appliedReward?.rewardProgram).toBeFalsy();

    const expectedDiscount = Math.round(subtotal * 0.1); // 8600
    const expectedTotal = subtotal - expectedDiscount; // 77400

    const applyRes = await request(app)
      .put(`/api/order/${orderId}`)
      .send({
        appliedReward: {
          rewardProgram: percentageProgram._id,
          type: "percentage_discount",
          discountAmount: expectedDiscount,
        },
      })
      .expect(200);

    expect(applyRes.body.success).toBe(true);
    expect(applyRes.body.data.appliedReward.type).toBe("percentage_discount");
    expect(applyRes.body.data.appliedReward.discountAmount).toBe(expectedDiscount);
    expect(applyRes.body.data.bills.rewardDiscount).toBe(expectedDiscount);
    expect(applyRes.body.data.bills.total).toBe(expectedTotal);
    expect(applyRes.body.data.bills.totalWithTax).toBe(expectedTotal);

    const redeemLogs = await RewardLog.countDocuments({
      customer: testCustomer._id,
      type: "reward_redeemed",
      rewardProgram: percentageProgram._id,
    });
    expect(redeemLogs).toBe(1);

    // Example assertion output shape (documented for readers):
    // subtotal: 86000, rewardDiscount: 8600, total: 77400
    console.log("Example — percentage reward applied:", {
      subtotal: applyRes.body.data.bills.subtotal,
      rewardDiscount: applyRes.body.data.bills.rewardDiscount,
      total: applyRes.body.data.bills.total,
    });
  });

  test("apply free_dish reward reduces bills.total by cheapest item price", async () => {
    const createRes = await request(app)
      .post("/api/order")
      .send(
        buildOrderPayload(testDish, {
          customer: testCustomer._id,
        })
      )
      .expect(201);

    const orderId = createRes.body.data._id;
    const subtotal = 81000;
    const expectedDiscount = 38000; // Medium is cheaper than Large

    const applyRes = await request(app)
      .put(`/api/order/${orderId}`)
      .send({
        appliedReward: {
          rewardProgram: freeDishProgram._id,
          type: "free_dish",
          discountAmount: expectedDiscount,
        },
      })
      .expect(200);

    expect(applyRes.body.data.appliedReward.discountAmount).toBe(expectedDiscount);
    expect(applyRes.body.data.bills.rewardDiscount).toBe(expectedDiscount);
    expect(applyRes.body.data.bills.total).toBe(subtotal - expectedDiscount);

    console.log("Example — free dish reward applied:", {
      subtotal,
      rewardDiscount: applyRes.body.data.bills.rewardDiscount,
      total: applyRes.body.data.bills.total,
    });
  });

  test("remove applied reward restores bills.total", async () => {
    const createRes = await request(app)
      .post("/api/order")
      .send(
        buildOrderPayload(testDish, {
          customer: testCustomer._id,
        })
      )
      .expect(201);

    const orderId = createRes.body.data._id;
    const subtotal = 81000;

    await request(app)
      .put(`/api/order/${orderId}`)
      .send({
        appliedReward: {
          rewardProgram: percentageProgram._id,
          type: "percentage_discount",
          discountAmount: 8100,
        },
      })
      .expect(200);

    const removeRes = await request(app)
      .put(`/api/order/${orderId}`)
      .send({ appliedReward: null })
      .expect(200);

    expect(removeRes.body.data.appliedReward?.rewardProgram).toBeFalsy();
    expect(removeRes.body.data.bills.rewardDiscount).toBe(0);
    expect(removeRes.body.data.bills.total).toBe(subtotal);

    const restoredLogs = await RewardLog.countDocuments({
      customer: testCustomer._id,
      type: "reward_restored",
      rewardProgram: percentageProgram._id,
    });
    expect(restoredLogs).toBe(1);
  });

  test("create order with customer and appliedReward discounts total on creation", async () => {
    const subtotal = 43000;
    const rewardDiscount = Math.round(subtotal * 0.1); // 4300
    const discountedTotal = subtotal - rewardDiscount;

    const createRes = await request(app)
      .post("/api/order")
      .send({
        customer: testCustomer._id,
        customerDetails: { name: "Walk-in", phone: "0900000002", guests: 1 },
        orderStatus: "progress",
        bills: {
          subtotal,
          promotionDiscount: 0,
          total: discountedTotal,
          tax: 0,
          totalWithTax: discountedTotal,
        },
        appliedPromotions: [],
        appliedReward: {
          rewardProgram: percentageProgram._id,
          type: "percentage_discount",
          discountAmount: rewardDiscount,
        },
        items: [
          {
            id: "single-item",
            dishId: testDish._id,
            name: "Matcha Latte (Large)",
            pricePerQuantity: 43000,
            quantity: 1,
            price: 43000,
            category: "Matcha",
            originalPricePerQuantity: 43000,
            originalPrice: 43000,
          },
        ],
        thirdPartyVendor: "None",
      })
      .expect(201);

    expect(createRes.body.data.appliedReward.discountAmount).toBe(rewardDiscount);
    expect(createRes.body.data.bills.rewardDiscount).toBe(rewardDiscount);
    expect(createRes.body.data.bills.total).toBe(discountedTotal);

    console.log("Example — reward applied at order creation:", {
      subtotal: createRes.body.data.bills.subtotal,
      rewardDiscount: createRes.body.data.bills.rewardDiscount,
      total: createRes.body.data.bills.total,
    });
  });

  test("reject reward apply when customer is not assigned", async () => {
    const createRes = await request(app)
      .post("/api/order")
      .send(buildOrderPayload(testDish))
      .expect(201);

    const orderId = createRes.body.data._id;

    const applyRes = await request(app)
      .put(`/api/order/${orderId}`)
      .send({
        appliedReward: {
          rewardProgram: percentageProgram._id,
          type: "percentage_discount",
          discountAmount: 8100,
        },
      })
      .expect(400);

    expect(applyRes.body.message).toMatch(/customer must be assigned/i);

    const unchanged = await Order.findById(orderId);
    expect(unchanged.bills.total).toBe(81000);
    expect(unchanged.appliedReward?.rewardProgram).toBeFalsy();
  });
});
