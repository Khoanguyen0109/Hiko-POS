import { describe, expect, it } from "@jest/globals";
import { convertRecipeQtyToStockQty } from "../utils/unitConversion.js";

describe("convertRecipeQtyToStockQty", () => {
  it("returns qty unchanged when units match", () => {
    expect(
      convertRecipeQtyToStockQty(2, "liter", { unit: "liter", averageCost: 1 })
    ).toBe(2);
  });

  it("converts ml recipe qty into boxed stock via contentQuantity", () => {
    expect(
      convertRecipeQtyToStockQty(30, "ml", {
        unit: "box",
        averageCost: 100000,
        contentQuantity: 1000,
        contentUnit: "ml",
      })
    ).toBe(0.03);
  });

  it("converts g to kg without package content", () => {
    expect(
      convertRecipeQtyToStockQty(500, "g", { unit: "kg", averageCost: 1 })
    ).toBe(0.5);
  });

  it("returns null when units cannot convert", () => {
    expect(
      convertRecipeQtyToStockQty(1, "ml", { unit: "piece", averageCost: 1 })
    ).toBeNull();
  });
});
