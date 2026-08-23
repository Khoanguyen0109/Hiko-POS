# Material Variance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only Dashboard tab that reports theoretical ingredient usage (completed orders × dish and topping recipes) versus actual production exports.

**Architecture:** Pure helpers convert recipe qty into stock units and build the variance payload from in-memory orders, recipes, and exports. A thin service loads Mongo documents; a new `GET /api/storage/variance` endpoint (admin + store context) returns the payload. The frontend adds a Redux slice and a Dashboard tab that reuses the existing date filter.

**Tech Stack:** Node.js + Express + TypeScript + Mongoose + Jest (backend); React 18 + Vite + Redux Toolkit + Tailwind CSS (frontend).

**Spec:** `docs/superpowers/specs/2026-08-23-material-variance-design.md`

## Global Constraints

- Report only — do not deduct stock or create exports on order complete
- Actual usage = completed exports with reason `production` only (`to_store` ignored)
- Theoretical usage = `orderStatus: "completed"` and `completedAt` in the Vietnam date range
- Include dish recipes (size via `getRecipeForSize`) and topping recipes
- Missing recipes / unit mismatches go to `coverage`; they do not fail the request
- Admin only; Dashboard sends `scope: "all"`
- Cost uses current `StorageItem.averageCost`
- No TypeScript `any` in `pos-backend/`
- Do not change Storage Analytics behavior
- No CSV, no row drill-down, no member access

## File Map

**Create:**
- `pos-backend/types/variance.ts` — payload and input types
- `pos-backend/services/varianceService.ts` — `buildMaterialVariance` + `computeMaterialVariance`
- `pos-backend/controllers/storageVarianceController.ts` — HTTP wrapper
- `pos-backend/routes/storageVarianceRoute.ts` — `GET /`
- `pos-backend/tests/unitConversionStockQty.test.ts`
- `pos-backend/tests/varianceService.test.ts`
- `pos-backend/tests/storageVarianceRoute.test.ts`
- `pos-frontend/src/redux/slices/storageVarianceSlice.js`
- `pos-frontend/src/components/dashboard/MaterialVariance.jsx`

**Modify:**
- `pos-backend/utils/unitConversion.ts` — add `convertRecipeQtyToStockQty`
- `pos-backend/app.ts` — mount `/api/storage/variance`
- `pos-frontend/src/https/index.js` — `getStorageVariance`
- `pos-frontend/src/redux/store.js` — register reducer
- `pos-frontend/src/pages/Dashboard.jsx` — admin tab

---

### Task 1: Recipe qty → stock qty conversion

**Files:**
- Modify: `pos-backend/utils/unitConversion.ts`
- Create: `pos-backend/tests/unitConversionStockQty.test.ts`

**Interfaces:**
- Consumes: existing `StorageItemCostInput`, `convertQuantity`, `hasPackageContent`, `normalizeUnit`
- Produces: `convertRecipeQtyToStockQty(quantity: number, recipeUnit: string, item: StorageItemCostInput): number | null`

- [ ] **Step 1: Write the failing tests**

Create `pos-backend/tests/unitConversionStockQty.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=unitConversionStockQty -v`

Expected: FAIL — `convertRecipeQtyToStockQty` is not exported.

- [ ] **Step 3: Add the function**

Append to `pos-backend/utils/unitConversion.ts`:

```ts
export function convertRecipeQtyToStockQty(
    quantity: number,
    recipeUnit: string,
    item: StorageItemCostInput
): number | null {
    if (quantity <= 0) {
        return 0;
    }

    const normalizedRecipeUnit = normalizeUnit(recipeUnit);

    if (normalizedRecipeUnit === normalizeUnit(item.unit)) {
        return quantity;
    }

    if (hasPackageContent(item)) {
        const quantityInContentUnit = convertQuantity(
            quantity,
            normalizedRecipeUnit,
            item.contentUnit!
        );
        if (quantityInContentUnit !== null) {
            return quantityInContentUnit / item.contentQuantity!;
        }
    }

    return convertQuantity(quantity, normalizedRecipeUnit, item.unit);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=unitConversionStockQty -v`

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add pos-backend/utils/unitConversion.ts pos-backend/tests/unitConversionStockQty.test.ts
git commit -m "feat(storage): convert recipe quantities into stock units"
```

---

### Task 2: Pure variance builder

**Files:**
- Create: `pos-backend/types/variance.ts`
- Create: `pos-backend/services/varianceService.ts`
- Create: `pos-backend/tests/varianceService.test.ts`

**Interfaces:**
- Consumes: `convertRecipeQtyToStockQty`, `getRecipeForSize` from `recipeService.ts`
- Produces: `buildMaterialVariance(input: MaterialVarianceInput): MaterialVarianceData`

- [ ] **Step 1: Add types**

Create `pos-backend/types/variance.ts`:

```ts
export interface VarianceStoreInfo {
  _id: string;
  name: string;
  code: string;
}

export interface VarianceStoreSummary {
  store: { id: string; name: string; code: string };
  summary: {
    theoreticalCost: number;
    actualCost: number;
    varianceCost: number;
    coverageMissingPortions: number;
  };
}

export interface VarianceItemRow {
  storageItemId: string;
  storeId: string;
  storeName: string;
  name: string;
  code: string;
  unit: string;
  averageCost: number;
  theoreticalQty: number;
  actualQty: number;
  varianceQty: number;
  variancePct: number | null;
  theoreticalCost: number;
  actualCost: number;
  varianceCost: number;
}

export interface VarianceMissingRecipe {
  type: "dish" | "topping";
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  portions: number;
}

export interface VarianceUnitMismatch {
  storageItemId: string;
  name: string;
  storeId: string;
  storeName: string;
  fromUnit: string;
  toUnit: string;
  portions: number;
}

export interface MaterialVarianceSummary {
  completedOrderCount: number;
  theoreticalCost: number;
  actualCost: number;
  varianceCost: number;
  itemsOver: number;
  itemsUnder: number;
  coverageMissingPortions: number;
  coverageUnitMismatchCount: number;
}

export interface MaterialVarianceData {
  scope: "all" | "single";
  stores: VarianceStoreInfo[];
  summary: MaterialVarianceSummary;
  storeSummaries: VarianceStoreSummary[];
  items: VarianceItemRow[];
  coverage: {
    missingRecipes: VarianceMissingRecipe[];
    unitMismatches: VarianceUnitMismatch[];
  };
}

export interface VarianceRecipeLine {
  storageItemId: string;
  quantity: number;
  unit: string;
}

export interface VarianceDishRecipe {
  storeId: string;
  dishId: string;
  ingredients: VarianceRecipeLine[];
  sizeVariantRecipes: { size: string; ingredients: VarianceRecipeLine[] }[];
  totalIngredientCost: number;
  otherCost?: number;
}

export interface VarianceToppingRecipe {
  storeId: string;
  toppingId: string;
  ingredients: VarianceRecipeLine[];
}

export interface VarianceOrderTopping {
  toppingId: string;
  name: string;
  quantity: number;
}

export interface VarianceOrderLine {
  dishId: string;
  name: string;
  quantity: number;
  size?: string | null;
  toppings: VarianceOrderTopping[];
}

export interface VarianceOrder {
  storeId: string;
  orderStatus: string;
  completedAt: Date | null;
  items: VarianceOrderLine[];
}

export interface VarianceExport {
  storeId: string;
  storageItemId: string;
  quantity: number;
  status: string;
  reason: string;
}

export interface VarianceStorageItem {
  id: string;
  storeId: string;
  name: string;
  code: string;
  unit: string;
  averageCost: number;
  isActive: boolean;
  contentQuantity?: number;
  contentUnit?: string;
}

export interface MaterialVarianceInput {
  scope: "all" | "single";
  stores: VarianceStoreInfo[];
  orders: VarianceOrder[];
  dishRecipes: VarianceDishRecipe[];
  toppingRecipes: VarianceToppingRecipe[];
  exports: VarianceExport[];
  storageItems: VarianceStorageItem[];
}
```

- [ ] **Step 2: Write the failing builder tests**

Create `pos-backend/tests/varianceService.test.ts`. Use the types above. Do **not** import a function that does not exist yet until Step 3 — write the tests against `buildMaterialVariance`.

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=varianceService -v`

Expected: FAIL — `buildMaterialVariance` is not exported.

- [ ] **Step 4: Implement `buildMaterialVariance`**

Create `pos-backend/services/varianceService.ts` with `buildMaterialVariance` only (loader comes in Task 3). Required behavior:

- Count `completedOrderCount` only for `orderStatus === "completed"` and `completedAt !== null`
- Dish recipe lookup key = `${storeId}:${dishId}`; topping = `${storeId}:${toppingId}`
- Size via `getRecipeForSize` (cast recipe to that helper’s shape; `totalIngredientCost` can be 0)
- Do not divide by `servings`
- Topping required qty = `recipeQty × topping.quantity × orderLine.quantity`
- Missing dish/topping recipe → coverage.missingRecipes (merge portions for the same id+store+type)
- Missing/inactive storage item or `convertRecipeQtyToStockQty === null` → coverage.unitMismatches (`toUnit` is `""` when item is missing/inactive)
- Actual: only `status === "completed"` and `reason === "production"`
- Row key = `${storeId}:${storageItemId}`; omit 0/0 rows
- Costs = qty × `averageCost`
- `variancePct` is `null` when `theoreticalQty === 0`
- Sort items by `Math.abs(varianceCost)` descending
- `scope === "all"`: `storeSummaries` includes every store in `input.stores` (zeros allowed); `scope === "single"`: `storeSummaries = []`
- `itemsOver` / `itemsUnder` from row `varianceQty`

Implementation:

```ts
import { getRecipeForSize } from "./recipeService.js";
import { convertRecipeQtyToStockQty } from "../utils/unitConversion.js";
import type {
    MaterialVarianceData,
    MaterialVarianceInput,
    VarianceDishRecipe,
    VarianceItemRow,
    VarianceMissingRecipe,
    VarianceStorageItem,
    VarianceUnitMismatch,
} from "../types/variance.js";

function rowKey(storeId: string, storageItemId: string): string {
    return `${storeId}:${storageItemId}`;
}

function recipeKey(storeId: string, id: string): string {
    return `${storeId}:${id}`;
}

export function buildMaterialVariance(input: MaterialVarianceInput): MaterialVarianceData {
    const storeNameById = new Map(input.stores.map((store) => [store._id, store.name]));
    const itemById = new Map(input.storageItems.map((item) => [item.id, item]));
    const dishByKey = new Map(
        input.dishRecipes.map((recipe) => [recipeKey(recipe.storeId, recipe.dishId), recipe])
    );
    const toppingByKey = new Map(
        input.toppingRecipes.map((recipe) => [recipeKey(recipe.storeId, recipe.toppingId), recipe])
    );

    const theoretical = new Map<string, number>();
    const actual = new Map<string, number>();
    const missingMap = new Map<string, VarianceMissingRecipe>();
    const mismatchMap = new Map<string, VarianceUnitMismatch>();

    const addQty = (map: Map<string, number>, storeId: string, storageItemId: string, qty: number) => {
        const key = rowKey(storeId, storageItemId);
        map.set(key, (map.get(key) ?? 0) + qty);
    };

    const addMissing = (row: VarianceMissingRecipe) => {
        const key = `${row.type}:${row.storeId}:${row.id}`;
        const existing = missingMap.get(key);
        if (existing) {
            existing.portions += row.portions;
            return;
        }
        missingMap.set(key, { ...row });
    };

    const addMismatch = (row: VarianceUnitMismatch) => {
        const key = `${row.storeId}:${row.storageItemId}:${row.fromUnit}:${row.toUnit}`;
        const existing = mismatchMap.get(key);
        if (existing) {
            existing.portions += row.portions;
            return;
        }
        mismatchMap.set(key, { ...row });
    };

    const applyLines = (
        storeId: string,
        lines: VarianceDishRecipe["ingredients"],
        multiplier: number
    ) => {
        for (const line of lines) {
            const item = itemById.get(line.storageItemId);
            const portions = multiplier;
            if (!item || !item.isActive || item.storeId !== storeId) {
                addMismatch({
                    storageItemId: line.storageItemId,
                    name: item?.name ?? line.storageItemId,
                    storeId,
                    storeName: storeNameById.get(storeId) ?? "",
                    fromUnit: line.unit,
                    toUnit: "",
                    portions,
                });
                continue;
            }

            const converted = convertRecipeQtyToStockQty(
                line.quantity * multiplier,
                line.unit,
                item
            );
            if (converted === null) {
                addMismatch({
                    storageItemId: item.id,
                    name: item.name,
                    storeId,
                    storeName: storeNameById.get(storeId) ?? "",
                    fromUnit: line.unit,
                    toUnit: item.unit,
                    portions,
                });
                continue;
            }

            addQty(theoretical, storeId, item.id, converted);
        }
    };

    let completedOrderCount = 0;

    for (const order of input.orders) {
        if (order.orderStatus !== "completed" || !order.completedAt) {
            continue;
        }
        completedOrderCount += 1;

        for (const line of order.items) {
            const dishRecipe = dishByKey.get(recipeKey(order.storeId, line.dishId));
            if (!dishRecipe) {
                addMissing({
                    type: "dish",
                    id: line.dishId,
                    name: line.name,
                    storeId: order.storeId,
                    storeName: storeNameById.get(order.storeId) ?? "",
                    portions: line.quantity,
                });
            } else {
                const sized = getRecipeForSize(
                    {
                        ingredients: dishRecipe.ingredients,
                        sizeVariantRecipes: dishRecipe.sizeVariantRecipes.map((variant) => ({
                            ...variant,
                            totalIngredientCost: 0,
                        })),
                        totalIngredientCost: dishRecipe.totalIngredientCost,
                        otherCost: dishRecipe.otherCost,
                    },
                    line.size
                );
                applyLines(order.storeId, sized.ingredients, line.quantity);
            }

            for (const topping of line.toppings) {
                const toppingRecipe = toppingByKey.get(
                    recipeKey(order.storeId, topping.toppingId)
                );
                if (!toppingRecipe) {
                    addMissing({
                        type: "topping",
                        id: topping.toppingId,
                        name: topping.name,
                        storeId: order.storeId,
                        storeName: storeNameById.get(order.storeId) ?? "",
                        portions: line.quantity * topping.quantity,
                    });
                    continue;
                }
                applyLines(
                    order.storeId,
                    toppingRecipe.ingredients,
                    line.quantity * topping.quantity
                );
            }
        }
    }

    for (const exp of input.exports) {
        if (exp.status !== "completed" || exp.reason !== "production") {
            continue;
        }
        addQty(actual, exp.storeId, exp.storageItemId, exp.quantity);
    }

    const keys = new Set([...theoretical.keys(), ...actual.keys()]);
    const items: VarianceItemRow[] = [];

    for (const key of keys) {
        const [storeId, storageItemId] = key.split(":");
        const item = itemById.get(storageItemId);
        const theoreticalQty = theoretical.get(key) ?? 0;
        const actualQty = actual.get(key) ?? 0;
        if (theoreticalQty === 0 && actualQty === 0) {
            continue;
        }

        const fallback: VarianceStorageItem = item ?? {
            id: storageItemId,
            storeId,
            name: storageItemId,
            code: "",
            unit: "",
            averageCost: 0,
            isActive: false,
        };
        const averageCost = fallback.averageCost;
        const varianceQty = actualQty - theoreticalQty;

        items.push({
            storageItemId,
            storeId,
            storeName: storeNameById.get(storeId) ?? "",
            name: fallback.name,
            code: fallback.code,
            unit: fallback.unit,
            averageCost,
            theoreticalQty,
            actualQty,
            varianceQty,
            variancePct: theoreticalQty === 0 ? null : varianceQty / theoreticalQty,
            theoreticalCost: theoreticalQty * averageCost,
            actualCost: actualQty * averageCost,
            varianceCost: varianceQty * averageCost,
        });
    }

    items.sort((a, b) => Math.abs(b.varianceCost) - Math.abs(a.varianceCost));

    const theoreticalCost = items.reduce((sum, row) => sum + row.theoreticalCost, 0);
    const actualCost = items.reduce((sum, row) => sum + row.actualCost, 0);
    const missingRecipes = [...missingMap.values()];
    const unitMismatches = [...mismatchMap.values()];
    const coverageMissingPortions = missingRecipes.reduce((sum, row) => sum + row.portions, 0);

    const storeSummaries =
        input.scope === "all"
            ? input.stores.map((store) => {
                  const storeItems = items.filter((row) => row.storeId === store._id);
                  const storeMissing = missingRecipes
                      .filter((row) => row.storeId === store._id)
                      .reduce((sum, row) => sum + row.portions, 0);
                  const storeTheoretical = storeItems.reduce((sum, row) => sum + row.theoreticalCost, 0);
                  const storeActual = storeItems.reduce((sum, row) => sum + row.actualCost, 0);
                  return {
                      store: { id: store._id, name: store.name, code: store.code },
                      summary: {
                          theoreticalCost: storeTheoretical,
                          actualCost: storeActual,
                          varianceCost: storeActual - storeTheoretical,
                          coverageMissingPortions: storeMissing,
                      },
                  };
              })
            : [];

    return {
        scope: input.scope,
        stores: input.stores,
        summary: {
            completedOrderCount,
            theoreticalCost,
            actualCost,
            varianceCost: actualCost - theoreticalCost,
            itemsOver: items.filter((row) => row.varianceQty > 0).length,
            itemsUnder: items.filter((row) => row.varianceQty < 0).length,
            coverageMissingPortions,
            coverageUnitMismatchCount: unitMismatches.length,
        },
        storeSummaries,
        items,
        coverage: { missingRecipes, unitMismatches },
    };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=varianceService -v`

Expected: PASS (6 tests). First-case math: Medium milk `0.2 × 2` + topping `0.05 × 1 × 2` = `0.5`.

- [ ] **Step 6: Commit**

```bash
git add pos-backend/types/variance.ts pos-backend/services/varianceService.ts pos-backend/tests/varianceService.test.ts
git commit -m "feat(storage): build material variance from orders and exports"
```

---

### Task 3: Load data, HTTP endpoint, auth

**Files:**
- Modify: `pos-backend/services/varianceService.ts`
- Create: `pos-backend/controllers/storageVarianceController.ts`
- Create: `pos-backend/routes/storageVarianceRoute.ts`
- Modify: `pos-backend/app.ts`
- Create: `pos-backend/tests/storageVarianceRoute.test.ts`

**Interfaces:**
- Consumes: `buildMaterialVariance`, `resolveAnalyticsStoreScope`, `getDateRangeVietnam`
- Produces: `computeMaterialVariance(args)` → `MaterialVarianceData`; `GET /api/storage/variance`

- [ ] **Step 1: Write the failing route tests**

Create `pos-backend/tests/storageVarianceRoute.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=storageVarianceRoute -v`

Expected: FAIL — controller module does not exist.

- [ ] **Step 3: Add loader, controller, route, mount**

Append `computeMaterialVariance` to `pos-backend/services/varianceService.ts`:

```ts
import Order from "../models/orderModel.js";
import DishRecipe from "../models/dishRecipeModel.js";
import ToppingRecipe from "../models/toppingRecipeModel.js";
import StorageExport from "../models/storageExportModel.js";
import StorageItem from "../models/storageItemModel.js";
import { getDateRangeVietnam } from "../utils/dateUtils.js";
import type { AnalyticsStoreScope } from "../utils/analyticsStoreScope.js";
import type { MongoFilter } from "../types/mongo.js";

export async function computeMaterialVariance(args: {
    storeScope: AnalyticsStoreScope;
    startDate?: string;
    endDate?: string;
}): Promise<MaterialVarianceData> {
    const { storeScope, startDate, endDate } = args;
    const stores = storeScope.stores.map((store) => ({
        _id: String(store._id),
        name: store.name,
        code: store.code,
    }));

    if (!storeScope.storeMatch) {
        return buildMaterialVariance({
            scope: storeScope.scope,
            stores,
            orders: [],
            dishRecipes: [],
            toppingRecipes: [],
            exports: [],
            storageItems: [],
        });
    }

    const { start, end } = getDateRangeVietnam(startDate, endDate);
    const completedAt: MongoFilter = {};
    if (start) completedAt.$gte = start;
    if (end) completedAt.$lte = end;

    const orderFilter: MongoFilter = {
        store: storeScope.storeMatch,
        orderStatus: "completed",
    };
    if (start || end) {
        orderFilter.completedAt = completedAt;
    }

    const exportDate: MongoFilter = {};
    if (start) exportDate.$gte = start;
    if (end) exportDate.$lte = end;

    const exportFilter: MongoFilter = {
        store: storeScope.storeMatch,
        status: "completed",
        reason: "production",
    };
    if (start || end) {
        exportFilter.exportDate = exportDate;
    }

    const [orders, dishRecipes, toppingRecipes, exports] = await Promise.all([
        Order.find(orderFilter).select("store items orderStatus completedAt").lean(),
        DishRecipe.find({ store: storeScope.storeMatch, isActive: true }).lean(),
        ToppingRecipe.find({ store: storeScope.storeMatch, isActive: true }).lean(),
        StorageExport.find(exportFilter).lean(),
    ]);

    const storageItemIds = [
        ...dishRecipes.flatMap((recipe) => [
            ...recipe.ingredients.map((line) => line.storageItemId),
            ...recipe.sizeVariantRecipes.flatMap((variant) =>
                variant.ingredients.map((line) => line.storageItemId)
            ),
        ]),
        ...toppingRecipes.flatMap((recipe) =>
            recipe.ingredients.map((line) => line.storageItemId)
        ),
        ...exports.map((row) => row.storageItemId),
    ];

    const storageItems = await StorageItem.find({
        _id: { $in: storageItemIds },
        store: storeScope.storeMatch,
    }).lean();

    return buildMaterialVariance({
        scope: storeScope.scope,
        stores,
        orders: orders.map((order) => ({
            storeId: String(order.store),
            orderStatus: order.orderStatus,
            completedAt: order.completedAt ?? null,
            items: order.items.map((item) => ({
                dishId: String(item.dishId),
                name: item.name,
                quantity: item.quantity,
                size: item.variant?.size ?? null,
                toppings: (item.toppings ?? []).map((topping) => ({
                    toppingId: String(topping.toppingId),
                    name: topping.name,
                    quantity: topping.quantity,
                })),
            })),
        })),
        dishRecipes: dishRecipes.map((recipe) => ({
            storeId: String(recipe.store),
            dishId: String(recipe.dishId),
            ingredients: recipe.ingredients.map((line) => ({
                storageItemId: String(line.storageItemId),
                quantity: line.quantity,
                unit: line.unit,
            })),
            sizeVariantRecipes: recipe.sizeVariantRecipes.map((variant) => ({
                size: variant.size,
                ingredients: variant.ingredients.map((line) => ({
                    storageItemId: String(line.storageItemId),
                    quantity: line.quantity,
                    unit: line.unit,
                })),
            })),
            totalIngredientCost: recipe.totalIngredientCost,
            otherCost: recipe.otherCost,
        })),
        toppingRecipes: toppingRecipes.map((recipe) => ({
            storeId: String(recipe.store),
            toppingId: String(recipe.toppingId),
            ingredients: recipe.ingredients.map((line) => ({
                storageItemId: String(line.storageItemId),
                quantity: line.quantity,
                unit: line.unit,
            })),
        })),
        exports: exports.map((row) => ({
            storeId: String(row.store),
            storageItemId: String(row.storageItemId),
            quantity: row.quantity,
            status: row.status,
            reason: row.reason,
        })),
        storageItems: storageItems.map((item) => ({
            id: String(item._id),
            storeId: String(item.store),
            name: item.name,
            code: item.code,
            unit: item.unit,
            averageCost: item.averageCost ?? 0,
            isActive: item.isActive,
            contentQuantity: item.contentQuantity,
            contentUnit: item.contentUnit,
        })),
    });
}
```

Create `pos-backend/controllers/storageVarianceController.ts`:

```ts
import type { NextFunction, Request, Response } from "express";
import { resolveAnalyticsStoreScope } from "../utils/analyticsStoreScope.js";
import { computeMaterialVariance } from "../services/varianceService.js";

export const getStorageVariance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const storeScope = await resolveAnalyticsStoreScope(req);
        const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
        const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
        const data = await computeMaterialVariance({ storeScope, startDate, endDate });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
```

Create `pos-backend/routes/storageVarianceRoute.ts`:

```ts
import express from "express";
import { getStorageVariance } from "../controllers/storageVarianceController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.get("/", isVerifiedUser, storeContext, isAdmin, getStorageVariance);

export default router;
```

In `pos-backend/app.ts`, add the import next to `storageAnalyticsRoute` and mount:

```ts
import storageVarianceRoute from "./routes/storageVarianceRoute.js";
```

```ts
app.use("/api/storage/variance", storageVarianceRoute);
```

Place the `app.use` immediately after `/api/storage/analytics`.

- [ ] **Step 4: Run route tests**

Run: `cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=storageVarianceRoute -v`

Expected: PASS (403 member, 200 admin).

Also run: `cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=varianceService -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pos-backend/services/varianceService.ts pos-backend/controllers/storageVarianceController.ts pos-backend/routes/storageVarianceRoute.ts pos-backend/app.ts pos-backend/tests/storageVarianceRoute.test.ts
git commit -m "feat(storage): add admin material variance API"
```

---

### Task 4: Dashboard tab

**Files:**
- Modify: `pos-frontend/src/https/index.js` (after `getStorageAnalytics`)
- Create: `pos-frontend/src/redux/slices/storageVarianceSlice.js`
- Modify: `pos-frontend/src/redux/store.js`
- Create: `pos-frontend/src/components/dashboard/MaterialVariance.jsx`
- Modify: `pos-frontend/src/pages/Dashboard.jsx`

**Interfaces:**
- Consumes: `GET /api/storage/variance` payload from Task 3
- Produces: admin tab **Material Variance**

- [ ] **Step 1: API + Redux + store**

In `pos-frontend/src/https/index.js`, immediately after `getStorageAnalytics`:

```js
export const getStorageVariance = (params) => axiosWrapper.get("/api/storage/variance", { params });
```

Create `pos-frontend/src/redux/slices/storageVarianceSlice.js`:

```js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getStorageVariance } from "../../https";

export const fetchStorageVariance = createAsyncThunk(
    "storageVariance/fetch",
    async (params = {}, thunkAPI) => {
        try {
            const { data } = await getStorageVariance(params);
            return data.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || "Failed to fetch material variance"
            );
        }
    }
);

const storageVarianceSlice = createSlice({
    name: "storageVariance",
    initialState: {
        summary: null,
        items: [],
        storeSummaries: [],
        coverage: { missingRecipes: [], unitMismatches: [] },
        scope: "single",
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStorageVariance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageVariance.fulfilled, (state, action) => {
                state.loading = false;
                state.summary = action.payload.summary;
                state.items = action.payload.items;
                state.storeSummaries = action.payload.storeSummaries || [];
                state.coverage = action.payload.coverage || {
                    missingRecipes: [],
                    unitMismatches: [],
                };
                state.scope = action.payload.scope || "single";
                state.error = null;
            })
            .addCase(fetchStorageVariance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = storageVarianceSlice.actions;
export default storageVarianceSlice.reducer;
```

In `pos-frontend/src/redux/store.js`:

```js
import storageVarianceReducer from "./slices/storageVarianceSlice";
```

Register next to `storageAnalytics`:

```js
        storageAnalytics: storageAnalyticsReducer,
        storageVariance: storageVarianceReducer,
```

- [ ] **Step 2: MaterialVariance component**

Create `pos-frontend/src/components/dashboard/MaterialVariance.jsx`. Copy the date-param `useEffect` from `StorageAnalytics.jsx` (today / week / month / custom + `scope: "all"`), but dispatch `fetchStorageVariance`.

UI rules from the spec:

- Loading: `<LoadingState message="Loading material variance..." />`
- Error: same red-center pattern as Storage Analytics
- Coverage banner if `coverage.missingRecipes.length` or `coverage.unitMismatches.length`
- Four cards: Theoretical cost, Actual cost, Variance cost, Completed orders (`formatVND` for money)
- Variance card: `text-red-400` when `varianceCost > 0`, `text-amber-400` when `< 0`, else `#f5f5f5`
- `StoreSummariesTable` when `scope === "all"` and `storeSummaries.length > 0` with columns Theoretical / Actual / Variance (VND)
- Items table: Store (if all), Item, Unit, Theoretical, Actual, Variance qty, Variance %, Variance VND
- Qty format: up to 3 decimals, trim trailing zeros (`Number(qty.toFixed(3))`)
- Variance %: `null` → `—`; else `(variancePct * 100).toFixed(1) + "%"`
- Row color: `varianceQty > 0` red, `< 0` amber
- Empty sentence only when `items.length === 0` and no coverage rows

```jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdWarning, MdTrendingUp, MdTrendingDown, MdInventory, MdReceipt } from "react-icons/md";
import { fetchStorageVariance } from "../../redux/slices/storageVarianceSlice";
import { formatVND } from "../../utils";
import { getTodayDateVietnam, getDateRangeByPeriodVietnam } from "../../utils/dateUtils";
import LoadingState from "../shared/LoadingState";
import StoreSummariesTable from "./StoreSummariesTable";

const formatQty = (qty) => Number(Number(qty || 0).toFixed(3));

const formatPct = (pct) => {
    if (pct === null || pct === undefined) return "—";
    return `${(pct * 100).toFixed(1)}%`;
};

const varianceClass = (value) => {
    if (value > 0) return "text-red-400";
    if (value < 0) return "text-amber-400";
    return "text-[#f5f5f5]";
};

const MaterialVariance = ({ dateFilter, customDateRange }) => {
    const dispatch = useDispatch();
    const { summary, items, storeSummaries, coverage, scope, loading, error } = useSelector(
        (state) => state.storageVariance
    );

    useEffect(() => {
        const params = {};
        const today = getTodayDateVietnam();

        if (dateFilter === "custom" && customDateRange.startDate && customDateRange.endDate) {
            params.startDate = customDateRange.startDate;
            params.endDate = customDateRange.endDate;
        } else if (dateFilter && dateFilter !== "custom") {
            switch (dateFilter) {
                case "today":
                    params.startDate = today;
                    params.endDate = today;
                    break;
                case "week": {
                    const { start } = getDateRangeByPeriodVietnam("thisWeek");
                    params.startDate = start;
                    params.endDate = today;
                    break;
                }
                case "month": {
                    const { start } = getDateRangeByPeriodVietnam("thisMonth");
                    params.startDate = start;
                    params.endDate = today;
                    break;
                }
                default:
                    break;
            }
        }

        dispatch(fetchStorageVariance({ ...params, scope: "all" }));
    }, [dispatch, dateFilter, customDateRange]);

    if (loading) {
        return <LoadingState message="Loading material variance..." />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <MdWarning className="mx-auto text-6xl text-red-500 mb-4" />
                <p className="text-red-400 text-lg mb-2">Error loading variance</p>
                <p className="text-[#ababab] text-sm">{error}</p>
            </div>
        );
    }

    const missing = coverage?.missingRecipes || [];
    const mismatches = coverage?.unitMismatches || [];
    const hasCoverage = missing.length > 0 || mismatches.length > 0;

    if ((!summary || items.length === 0) && !hasCoverage) {
        return (
            <div className="text-center py-12">
                <MdInventory className="mx-auto text-6xl text-[#ababab] mb-4" />
                <p className="text-[#ababab] text-lg">No order or production export data for this period.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-6">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {scope === "all" && (
                    <p className="text-sm text-[#ababab]">All stores · theoretical usage vs production exports</p>
                )}

                {hasCoverage && (
                    <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <MdWarning className="text-amber-400 mt-0.5 flex-shrink-0" size={22} />
                            <div className="space-y-2">
                                <p className="text-amber-200 font-medium">
                                    Coverage gaps — variance may be understated
                                </p>
                                {missing.length > 0 && (
                                    <ul className="text-sm text-[#f5f5f5] space-y-1">
                                        {missing.map((row) => (
                                            <li key={`${row.type}-${row.storeId}-${row.id}`}>
                                                {row.portions} {row.type} portions sold with no recipe: {row.name}
                                                {scope === "all" ? ` (${row.storeName})` : ""}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {mismatches.length > 0 && (
                                    <ul className="text-sm text-[#f5f5f5] space-y-1">
                                        {mismatches.map((row) => (
                                            <li key={`${row.storeId}-${row.storageItemId}-${row.fromUnit}`}>
                                                Cannot convert {row.name} {row.fromUnit}
                                                {row.toUnit ? ` → ${row.toUnit}` : ""} ({row.portions} portions)
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3">
                            <MdTrendingUp className="text-xl text-green-500" />
                            <span className="text-[#ababab] text-xs">Theoretical</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5]">
                            {formatVND(summary?.theoreticalCost || 0)}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Recipe usage from completed orders</p>
                    </div>
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3">
                            <MdTrendingDown className="text-xl text-orange-500" />
                            <span className="text-[#ababab] text-xs">Actual</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5]">
                            {formatVND(summary?.actualCost || 0)}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Production exports</p>
                    </div>
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3">
                            <MdInventory className="text-xl text-brand" />
                            <span className="text-[#ababab] text-xs">Variance</span>
                        </div>
                        <h3 className={`text-lg sm:text-xl font-bold ${varianceClass(summary?.varianceCost || 0)}`}>
                            {formatVND(summary?.varianceCost || 0)}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Actual minus theoretical</p>
                    </div>
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3">
                            <MdReceipt className="text-xl text-brand" />
                            <span className="text-[#ababab] text-xs">Orders</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5]">
                            {summary?.completedOrderCount || 0}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Completed in this period</p>
                    </div>
                </div>

                {scope === "all" && storeSummaries?.length > 0 && (
                    <StoreSummariesTable
                        title="Variance by Store"
                        summaries={storeSummaries}
                        columns={[
                            {
                                key: "theoreticalCost",
                                label: "Theoretical",
                                format: (row) => formatVND(row.summary?.theoreticalCost || 0),
                            },
                            {
                                key: "actualCost",
                                label: "Actual",
                                format: (row) => formatVND(row.summary?.actualCost || 0),
                            },
                            {
                                key: "varianceCost",
                                label: "Variance",
                                format: (row) => formatVND(row.summary?.varianceCost || 0),
                            },
                        ]}
                    />
                )}

                {items.length > 0 && (
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <h2 className="text-xl font-semibold text-[#f5f5f5] mb-4">Material variance</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#343434]">
                                        {scope === "all" && (
                                            <th className="text-left py-3 px-2 text-[#ababab] text-xs font-medium">Store</th>
                                        )}
                                        <th className="text-left py-3 px-2 text-[#ababab] text-xs font-medium">Item</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Unit</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Theoretical</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Actual</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Var qty</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Var %</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Var VND</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr
                                            key={`${item.storeId}-${item.storageItemId}`}
                                            className="border-b border-[#343434] hover:bg-[#1f1f1f]"
                                        >
                                            {scope === "all" && (
                                                <td className="py-3 px-2 text-[#ababab] text-xs whitespace-nowrap">
                                                    {item.storeName}
                                                </td>
                                            )}
                                            <td className="py-3 px-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[#f5f5f5] font-medium text-sm">{item.name}</span>
                                                    <span className="text-[#ababab] text-xs">{item.code}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right text-[#ababab] text-xs">{item.unit}</td>
                                            <td className="py-3 px-2 text-right text-[#f5f5f5] text-sm">
                                                {formatQty(item.theoreticalQty)}
                                            </td>
                                            <td className="py-3 px-2 text-right text-[#f5f5f5] text-sm">
                                                {formatQty(item.actualQty)}
                                            </td>
                                            <td className={`py-3 px-2 text-right text-sm font-medium ${varianceClass(item.varianceQty)}`}>
                                                {formatQty(item.varianceQty)}
                                            </td>
                                            <td className={`py-3 px-2 text-right text-sm ${varianceClass(item.varianceQty)}`}>
                                                {formatPct(item.variancePct)}
                                            </td>
                                            <td className={`py-3 px-2 text-right text-sm font-medium ${varianceClass(item.varianceCost)}`}>
                                                {formatVND(item.varianceCost)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaterialVariance;
```

- [ ] **Step 3: Wire the Dashboard tab**

In `pos-frontend/src/pages/Dashboard.jsx`:

1. Import `MaterialVariance` next to `StorageAnalytics`.
2. Insert `"Material Variance"` immediately after `"Storage Analytics"` in the admin tabs array:

```js
["Spending", "Shift Checkout", "Salary", "Storage Analytics", "Material Variance", "Rewards", "Redeem Reward"]
```

3. Render after the Storage Analytics block:

```jsx
      {activeTab === "Material Variance" && isAdmin && (
        <MaterialVariance
          dateFilter={dateFilter}
          customDateRange={customDateRange}
        />
      )}
```

- [ ] **Step 4: Verify**

Run: `cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns='unitConversionStockQty|varianceService|storageVarianceRoute' -v`

Expected: all PASS.

Manual (when servers are running): log in as admin, open Dashboard → Material Variance, switch today/week/month. Confirm member accounts do not see the tab.

- [ ] **Step 5: Commit**

```bash
git add pos-frontend/src/https/index.js pos-frontend/src/redux/slices/storageVarianceSlice.js pos-frontend/src/redux/store.js pos-frontend/src/components/dashboard/MaterialVariance.jsx pos-frontend/src/pages/Dashboard.jsx
git commit -m "feat(dashboard): add admin Material Variance tab"
```

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Report only, no auto-deduct | Global constraint; no order-controller changes |
| Actual = production exports | Tasks 2–3 |
| Theoretical = completed + `completedAt` | Tasks 2–3 |
| Dish + topping recipes, size-aware | Task 2 |
| Coverage for missing recipes / unit mismatch | Task 2 + Task 4 banner |
| Admin only, `scope=all` | Tasks 3–4 |
| `GET /api/storage/variance` | Task 3 |
| Dashboard tab + date filter | Task 4 |
| Cost = current averageCost | Task 2 |
| Conversion box/ml | Tasks 1–2 |
| Jest cases 1–6 + 403/200 | Tasks 2–3 |
| Do not change Storage Analytics | No edits to that controller/component |

## Self-review

- No TBD / “similar to Task N” leftovers
- `buildMaterialVariance` / `computeMaterialVariance` / `getStorageVariance` / `fetchStorageVariance` names are consistent across tasks
- First builder test expected qty is `0.5` (Medium `0.2×2` + topping `0.05×2`)
