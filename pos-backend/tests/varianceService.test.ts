import { describe, expect, it } from "@jest/globals";
import { buildMaterialVariance } from "../services/varianceService.js";
import type { MaterialVarianceInput, VarianceStorageItem, VarianceStoreInfo } from "../types/variance.js";

const store: VarianceStoreInfo = { _id: "s1", name: "Hiko D1", code: "D1" };
const milk: VarianceStorageItem = {
  id: "milk",
  storeId: "s1",
  name: "Fresh Milk",
  code: "MILK-001",
  unit: "liter",
  averageCost: 22000,
  isActive: true,
};
const syrupBox: VarianceStorageItem = {
  id: "syrup",
  storeId: "s1",
  name: "Syrup",
  code: "SYR-001",
  unit: "box",
  averageCost: 100000,
  isActive: true,
  contentQuantity: 1000,
  contentUnit: "ml",
};

const baseInput = (): MaterialVarianceInput => ({
  scope: "single",
  stores: [store],
  orders: [],
  dishRecipes: [],
  toppingRecipes: [],
  exports: [],
  storageItems: [milk, syrupBox],
});

describe("buildMaterialVariance", () => {
  it("adds dish size recipe and topping recipe into theoretical qty", () => {
    const result = buildMaterialVariance({
      ...baseInput(),
      orders: [
        {
          storeId: "s1",
          orderStatus: "completed",
          completedAt: new Date(),
          items: [
            {
              dishId: "latte",
              name: "Latte",
              quantity: 2,
              size: "Medium",
              toppings: [{ toppingId: "boba", name: "Boba", quantity: 1 }],
            },
          ],
        },
      ],
      dishRecipes: [
        {
          storeId: "s1",
          dishId: "latte",
          ingredients: [{ storageItemId: "milk", quantity: 0.1, unit: "liter" }],
          sizeVariantRecipes: [
            {
              size: "Medium",
              ingredients: [{ storageItemId: "milk", quantity: 0.2, unit: "liter" }],
            },
          ],
          totalIngredientCost: 0,
        },
      ],
      toppingRecipes: [
        {
          storeId: "s1",
          toppingId: "boba",
          ingredients: [{ storageItemId: "milk", quantity: 0.05, unit: "liter" }],
        },
      ],
    });

    const row = result.items.find((item) => item.storageItemId === "milk");
    expect(row?.theoreticalQty).toBeCloseTo(0.5);
    expect(result.summary.completedOrderCount).toBe(1);
  });

  it("counts production exports and ignores to_store", () => {
    const result = buildMaterialVariance({
      ...baseInput(),
      exports: [
        { storeId: "s1", storageItemId: "milk", quantity: 3, status: "completed", reason: "production" },
        { storeId: "s1", storageItemId: "milk", quantity: 9, status: "completed", reason: "to_store" },
      ],
    });

    const row = result.items.find((item) => item.storageItemId === "milk");
    expect(row?.actualQty).toBe(3);
    expect(row?.theoreticalQty).toBe(0);
  });

  it("flags a sold dish with no recipe and adds zero theoretical", () => {
    const result = buildMaterialVariance({
      ...baseInput(),
      orders: [
        {
          storeId: "s1",
          orderStatus: "completed",
          completedAt: new Date(),
          items: [{ dishId: "special", name: "Seasonal", quantity: 12, toppings: [] }],
        },
      ],
    });

    expect(result.items).toEqual([]);
    expect(result.coverage.missingRecipes).toEqual([
      {
        type: "dish",
        id: "special",
        name: "Seasonal",
        storeId: "s1",
        storeName: "Hiko D1",
        portions: 12,
      },
    ]);
    expect(result.summary.coverageMissingPortions).toBe(12);
  });

  it("converts ml recipe qty into boxed stock", () => {
    const result = buildMaterialVariance({
      ...baseInput(),
      orders: [
        {
          storeId: "s1",
          orderStatus: "completed",
          completedAt: new Date(),
          items: [{ dishId: "tea", name: "Tea", quantity: 1, toppings: [] }],
        },
      ],
      dishRecipes: [
        {
          storeId: "s1",
          dishId: "tea",
          ingredients: [{ storageItemId: "syrup", quantity: 30, unit: "ml" }],
          sizeVariantRecipes: [],
          totalIngredientCost: 0,
        },
      ],
    });

    const row = result.items.find((item) => item.storageItemId === "syrup");
    expect(row?.theoreticalQty).toBeCloseTo(0.03);
    expect(row?.unit).toBe("box");
  });

  it("sets variance qty and cost as actual minus theoretical", () => {
    const result = buildMaterialVariance({
      ...baseInput(),
      orders: [
        {
          storeId: "s1",
          orderStatus: "completed",
          completedAt: new Date(),
          items: [{ dishId: "latte", name: "Latte", quantity: 1, toppings: [] }],
        },
      ],
      dishRecipes: [
        {
          storeId: "s1",
          dishId: "latte",
          ingredients: [{ storageItemId: "milk", quantity: 10, unit: "liter" }],
          sizeVariantRecipes: [],
          totalIngredientCost: 0,
        },
      ],
      exports: [
        { storeId: "s1", storageItemId: "milk", quantity: 12, status: "completed", reason: "production" },
      ],
    });

    const row = result.items.find((item) => item.storageItemId === "milk");
    expect(row?.varianceQty).toBe(2);
    expect(row?.varianceCost).toBe(2 * 22000);
    expect(row?.variancePct).toBeCloseTo(0.2);
    expect(result.summary.itemsOver).toBe(1);
  });

  it("excludes cancelled orders", () => {
    const result = buildMaterialVariance({
      ...baseInput(),
      orders: [
        {
          storeId: "s1",
          orderStatus: "cancelled",
          completedAt: new Date(),
          items: [{ dishId: "latte", name: "Latte", quantity: 1, toppings: [] }],
        },
      ],
      dishRecipes: [
        {
          storeId: "s1",
          dishId: "latte",
          ingredients: [{ storageItemId: "milk", quantity: 1, unit: "liter" }],
          sizeVariantRecipes: [],
          totalIngredientCost: 0,
        },
      ],
    });

    expect(result.items).toEqual([]);
    expect(result.summary.completedOrderCount).toBe(0);
  });
});
