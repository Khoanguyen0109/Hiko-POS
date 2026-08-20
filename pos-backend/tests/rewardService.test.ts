import { beforeEach, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import RewardService from "../services/rewardService.js";
import Category from "../models/categoryModel.js";
import Customer from "../models/customerModel.js";
import Dish from "../models/dishModel.js";
import RewardProgram from "../models/rewardProgramModel.js";
import RewardLog from "../models/rewardLogModel.js";

describe("RewardService.getDishCountForProgram", () => {
  test("uses totalDishCount when program has no eligible categories", () => {
    const count = RewardService.getDishCountForProgram({}, 10, {
      "abc": 4,
    });
    expect(count).toBe(10);
  });

  test("counts only matching category dishes, not other categories", () => {
    const matchaId = new mongoose.Types.ObjectId();
    const coffeeId = new mongoose.Types.ObjectId();
    const count = RewardService.getDishCountForProgram(
      { eligibleCategories: [matchaId] },
      10,
      {
        [String(matchaId)]: 3,
        [String(coffeeId)]: 7,
      }
    );
    expect(count).toBe(3);
  });

  test("reads category id from populated category documents", () => {
    const matchaId = new mongoose.Types.ObjectId();
    const count = RewardService.getDishCountForProgram(
      { eligibleCategories: [{ _id: matchaId, name: "Matcha" }] },
      10,
      { [String(matchaId)]: 4 }
    );
    expect(count).toBe(4);
  });
});

describe("RewardService.getProgramProgress", () => {
  let matchaCategory;
  let coffeeCategory;
  let customer;

  beforeEach(async () => {
    matchaCategory = await Category.create({
      name: "Matcha",
      description: "Matcha drinks",
    });
    coffeeCategory = await Category.create({
      name: "Coffee",
      description: "Coffee drinks",
    });

    customer = await Customer.create({
      phone: "0901234567",
      name: "Loyalty Guest",
      totalDishCount: 5,
      categoryDishCounts: new Map([
        [String(matchaCategory._id), 2],
        [String(coffeeCategory._id), 3],
      ]),
    });
  });

  test("returns Matcha program count without including coffee dishes", async () => {
    await RewardProgram.create({
      name: "Buy 5 Matcha",
      type: "percentage_discount",
      dishThreshold: 5,
      discountPercent: 10,
      isActive: true,
      eligibleCategories: [matchaCategory._id],
    });

    const progress = await RewardService.getProgramProgress(customer);

    expect(progress).toHaveLength(1);
    expect(progress[0].name).toBe("Buy 5 Matcha");
    expect(progress[0].dishCount).toBe(2);
    expect(progress[0].dishThreshold).toBe(5);
    expect(progress[0].categoryLabels).toEqual(["Matcha"]);
  });

  test("returns totalDishCount for a program with no eligible categories", async () => {
    await RewardProgram.create({
      name: "Any 10 dishes",
      type: "percentage_discount",
      dishThreshold: 10,
      discountPercent: 10,
      isActive: true,
      eligibleCategories: [],
    });

    const progress = await RewardService.getProgramProgress(customer);

    expect(progress).toHaveLength(1);
    expect(progress[0].dishCount).toBe(5);
    expect(progress[0].categoryLabels).toEqual([]);
  });
});

describe("RewardService.earnDishes — buy 10 Matcha get 1 free", () => {
  test("5 Matcha + 5 Tea counts as 5 toward the Matcha reward, not 10", async () => {
    const matchaCategory = await Category.create({ name: "Matcha" });
    const teaCategory = await Category.create({ name: "Tea" });

    const matchaDish = await Dish.create({
      name: "Matcha Latte",
      price: 45000,
      category: matchaCategory._id,
      isAvailable: true,
    });
    const teaDish = await Dish.create({
      name: "Jasmine Tea",
      price: 35000,
      category: teaCategory._id,
      isAvailable: true,
    });

    const customer = await Customer.create({
      phone: "0907654321",
      name: "Mixed Order Guest",
    });

    await RewardProgram.create({
      name: "Buy 10 Matcha get 1 free",
      type: "free_dish",
      dishThreshold: 10,
      isActive: true,
      eligibleCategories: [matchaCategory._id],
    });

    const orderId = new mongoose.Types.ObjectId();
    const storeId = new mongoose.Types.ObjectId();
    const staffId = new mongoose.Types.ObjectId();

    const result = await RewardService.earnDishes(
      String(customer._id),
      String(orderId),
      String(storeId),
      10,
      String(staffId),
      [
        { dishId: matchaDish._id, quantity: 5 },
        { dishId: teaDish._id, quantity: 5 },
      ]
    );

    const updated = await Customer.findById(customer._id);
    expect(updated).not.toBeNull();
    if (!updated) {
      throw new Error("Customer not found after earnDishes");
    }

    const progress = await RewardService.getProgramProgress(updated);
    const available = await RewardService.calculateAvailableRewards(String(customer._id));
    const unlocked = await RewardLog.countDocuments({
      customer: customer._id,
      type: "reward_unlocked",
    });

    expect(result.newTotal).toBe(10);
    expect(updated.totalDishCount).toBe(10);
    expect(updated.categoryDishCounts.get(String(matchaCategory._id))).toBe(5);
    expect(updated.categoryDishCounts.get(String(teaCategory._id))).toBe(5);

    expect(progress).toHaveLength(1);
    expect(progress[0].dishCount).toBe(5);
    expect(progress[0].dishThreshold).toBe(10);
    expect(progress[0].categoryLabels).toEqual(["Matcha"]);

    expect(result.newRewards).toHaveLength(0);
    expect(available).toHaveLength(0);
    expect(unlocked).toBe(0);
  });
});
