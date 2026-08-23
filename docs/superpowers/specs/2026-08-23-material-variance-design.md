# Material Variance — Design Spec

**Date:** 2026-08-23  
**Status:** Approved  
**Repos:** Hiko-POS (`pos-backend`, `pos-frontend`)

---

## Overview

Admin-only report that compares **theoretical ingredient usage** (completed orders × dish and topping recipes) with **actual usage** (completed production exports) for a date range. The gap is material variance: over-use, missing exports, or incomplete recipes.

This is **report-only**. Completing an order does not deduct stock. Import and export flows do not change.

---

## Key decisions

| Decision | Choice |
|----------|--------|
| Feature type | Report only — no auto-deduct on order complete |
| Actual usage | Completed storage exports with reason `production` only |
| Theoretical usage | Completed orders only, filtered by `completedAt` |
| Recipes | Dish recipes (size-aware) **and** topping recipes |
| Missing recipes | Still compute the period; flag coverage (do not hide, do not block) |
| Audience | Admin only |
| Placement | New Dashboard tab **Material Variance**, next to Storage Analytics |
| Scope | `scope=all` from the dashboard (same as Storage Analytics) |
| Cost | Current `StorageItem.averageCost` (exports have no historical cost) |
| Drill-down | Not in v1 |

---

## Out of scope

- Auto-export or stock deduction when an order is completed
- Physical stock counts, opening/closing snapshots
- Counting `to_store` transfers as usage
- Waste / damage / theft export reasons (not in the live export model)
- CSV export
- Click-into-item (“which drinks used this milk”)
- Member or store-staff access
- Changing Storage Analytics (it stays the import/export movement view)

---

## Current system (context)

- Dish and topping recipes already reference `StorageItem` per store, with size variants and unit conversion (`pos-backend/utils/unitConversion.ts`).
- Storage items, imports, and exports are store-scoped. Live export reasons are `production` and `to_store`.
- Completing an order does **not** create an export or change `currentStock`.
- Storage Analytics (`GET /api/storage/analytics`) sums import/export qty and cost. It does not compare to recipes × sales.
- Dashboard already has an admin date filter (today / week / month / custom, Vietnam timezone) and `resolveAnalyticsStoreScope`.

---

## Calculation

Use the same Vietnam date range as Storage Analytics (`getDateRangeVietnam`).

### Theoretical quantity

1. Load orders where `store` is in scope, `orderStatus` is `completed`, and `completedAt` is in `[start, end]`.
2. Orders with `orderStatus: completed` but `completedAt: null` are **excluded** (not in range).
3. Cancelled, pending, progress, and ready orders are **excluded**.
4. For each order line:
   - Resolve the dish recipe for that store (`DishRecipe` active).
   - Use `getRecipeForSize(recipe, item.variant.size)` (default recipe if size is missing or not on the recipe).
   - For each recipe line: `required = recipeQty × orderLine.quantity`.
   - Convert `required` from the recipe unit into the storage item’s **stock unit** (the unit exports already use).
   - For each topping on the line: same process with `ToppingRecipe`. Required qty is `recipeQty × topping.quantity × orderLine.quantity`.
5. Sum converted qty per `{ storeId, storageItemId }`.

Do **not** divide by recipe `servings`. Line quantity is per one sold dish or topping.

**Stock-unit conversion** (same rules as recipe costing, inverted to quantity):

- If recipe unit equals storage `unit` → use qty as-is.
- If the item has package content (`contentQuantity` + `contentUnit`): convert recipe qty into `contentUnit`, then divide by `contentQuantity` to get stock units. Example: recipe `30 ml`, item `1 box = 1000 ml` → `0.03 box`.
- Else use `convertQuantity(qty, recipeUnit, storageUnit)`.
- If conversion returns `null`, skip that line and add a **unit mismatch** coverage row. Do not treat it as 0 theoretical.

### Actual quantity

1. Load storage exports where `store` is in scope, `status` is `completed`, `reason` is `production`, and `exportDate` is in `[start, end]`.
2. Ignore `to_store` and non-completed exports.
3. Sum `quantity` per `{ storeId, storageItemId }` in the export’s unit (already the storage item unit).

### Variance

```
varianceQty   = actualQty − theoreticalQty
variancePct   = theoreticalQty === 0 ? null : varianceQty / theoreticalQty
theoreticalCost = theoreticalQty × averageCost
actualCost      = actualQty × averageCost
varianceCost    = varianceQty × averageCost
```

- `+` variance: exported more than recipes (over-pour, waste, extra export).
- `−` variance: exported less than recipes (missing export, under-portion, recipe too high).
- `averageCost` is the **current** storage item average cost (same as Storage Analytics export cost).
- `itemsOver` = count of item rows with `varianceQty > 0`. `itemsUnder` = count with `varianceQty < 0`. Zero-variance rows count as neither.

### Rows

Include a storage item only if `theoreticalQty > 0` or `actualQty > 0`. Unused items with 0/0 are omitted.

### Coverage (does not block the table)

**Missing recipe:** a sold dish or topping line with no active recipe for that store. Record `type` (`dish` | `topping`), id, name, store, and portion count (order line qty, or order line qty × topping qty). Theoretical contribution is 0.

**Unusable item:** recipe line whose storage item is missing or inactive. Skip the line. List it under `coverage.unitMismatches` with the recipe unit and an empty `toUnit`.

**Unit mismatch:** recipe unit cannot convert to the storage item unit. Line skipped; listed with item name, from/to units, and portion count.

---

## Backend

No new collections. Orders, recipes, and exports stay as they are.

### Endpoint

`GET /api/storage/variance`

Middleware: `isVerifiedUser` → `storeContext` → `isAdmin`.

Query:

| Param | Required | Notes |
|-------|----------|--------|
| `startDate` | No | ISO date; Vietnam range via `getDateRangeVietnam` |
| `endDate` | No | Same helper as analytics. Both omitted means no date filter (full history). Dashboard always sends dates. |
| `scope` | No | Dashboard sends `all`. Non-admin + `scope=all` → 403 (existing helper) |

No extra date validation beyond `getDateRangeVietnam` (an inverted range returns empty data, same as Storage Analytics). One bad recipe line does not fail the request; it goes to coverage.

### Files

| File | Role |
|------|------|
| `pos-backend/services/varianceService.ts` | Load data, explode recipes, convert units, build payload |
| `pos-backend/controllers/storageVarianceController.ts` | Parse query, call service, return JSON |
| `pos-backend/routes/storageVarianceRoute.ts` | Register `GET /` |
| `pos-backend/app.ts` | Mount at `/api/storage/variance` |

Do **not** add this logic to `storageItemController.ts` (analytics is already large).

Reuse: `resolveAnalyticsStoreScope`, `getDateRangeVietnam`, `getRecipeForSize`, `convertQuantity` / package-content helpers.

Load in batches (orders, dish recipes, topping recipes, production exports, storage items). No per-line database calls.

### Response

```json
{
  "success": true,
  "data": {
    "scope": "all",
    "stores": [{ "_id": "...", "name": "...", "code": "..." }],
    "summary": {
      "completedOrderCount": 42,
      "theoreticalCost": 1000000,
      "actualCost": 1200000,
      "varianceCost": 200000,
      "itemsOver": 3,
      "itemsUnder": 1,
      "coverageMissingPortions": 12,
      "coverageUnitMismatchCount": 0
    },
    "storeSummaries": [
      {
        "store": { "id": "...", "name": "...", "code": "..." },
        "summary": {
          "theoreticalCost": 500000,
          "actualCost": 600000,
          "varianceCost": 100000,
          "coverageMissingPortions": 4
        }
      }
    ],
    "items": [
      {
        "storageItemId": "...",
        "storeId": "...",
        "storeName": "Hiko District 1",
        "name": "Fresh Milk",
        "code": "MILK-001",
        "unit": "liter",
        "averageCost": 22000,
        "theoreticalQty": 10,
        "actualQty": 12,
        "varianceQty": 2,
        "variancePct": 0.2,
        "theoreticalCost": 220000,
        "actualCost": 264000,
        "varianceCost": 44000
      }
    ],
    "coverage": {
      "missingRecipes": [
        {
          "type": "dish",
          "id": "...",
          "name": "Seasonal Special",
          "storeId": "...",
          "storeName": "Hiko District 1",
          "portions": 12
        }
      ],
      "unitMismatches": []
    }
  }
}
```

`storeSummaries` is an empty array when `scope` is `single`. When `scope` is `all`, include every store in scope (zeros if that store had no usage or exports), same as Storage Analytics.  
`items` are sorted by absolute `varianceCost` descending.  
`variancePct` is `null` when `theoreticalQty` is 0 (actual-only row).  
Each `coverage.unitMismatches` row is `{ storageItemId, name, storeId, storeName, fromUnit, toUnit, portions }`. `toUnit` is `""` when the storage item is missing or inactive.

---

## Frontend

Admin Dashboard only. Members never see the tab.

### Files

| File | Role |
|------|------|
| `pos-frontend/src/https/index.js` | `getStorageVariance(params)` → `GET /api/storage/variance` |
| `pos-frontend/src/redux/slices/storageVarianceSlice.js` | Fetch thunk + `summary`, `items`, `storeSummaries`, `coverage`, `scope`, `loading`, `error` |
| `pos-frontend/src/redux/store.js` | Register reducer |
| `pos-frontend/src/components/dashboard/MaterialVariance.jsx` | Tab body |
| `pos-frontend/src/pages/Dashboard.jsx` | Add admin tab **Material Variance** next to Storage Analytics |

Fetch only when the tab is active. Always send `scope: "all"` and the same date params Storage Analytics uses (today / week / month / custom via Vietnam helpers).

### Screen

1. **Coverage banner** — shown when `coverageMissingPortions > 0` or unit mismatches exist. Lists dish/topping names and portion counts. Does not hide the table.
2. **Four cards** — Theoretical cost, Actual (production) cost, Variance cost, Completed orders. Variance card: red when `varianceCost > 0`, amber when `< 0`, neutral when `0`.
3. **By-store table** — when `scope === "all"` and `storeSummaries.length > 0`. Reuse `StoreSummariesTable` with theoretical / actual / variance cost columns.
4. **Items table** — Item, Store (if all-stores), Unit, Theoretical qty, Actual qty, Variance qty, Variance %, Variance VND. Over-use (`varianceQty > 0`) red; under-use amber.
5. **Empty** — no items and no coverage: “No order or production export data for this period.” If coverage exists but `items` is empty, show the banner and cards (zeros); do not show that empty sentence.
6. **Loading / error** — same pattern as `StorageAnalytics.jsx`.

No CSV. No row click. Storage Analytics tab is unchanged.

---

## Error handling

| Case | Behavior |
|------|----------|
| Not logged in | 401 (existing JWT middleware) |
| Not admin | 403 |
| Non-admin + `scope=all` | 403 from `resolveAnalyticsStoreScope` |
| Service exception | `next(error)` → `globalErrorHandler` |
| Bad recipe line / missing item / bad unit | Skip line, add coverage, return 200 |
| Empty period | 200 with zero summary, empty `items`, empty `coverage` |

---

## Testing

Backend Jest, same style as `rewardService.test.ts` / `promotionService.test.ts`.

`pos-backend/tests/varianceService.test.ts` (unit, no HTTP):

1. Two completed Medium dishes + one topping → expected theoretical qty.
2. Production export counts toward actual; `to_store` does not.
3. Missing recipe → theoretical 0 for that line + coverage row with portion count.
4. Recipe in `ml` vs stock in `box` with `contentQuantity` → converted theoretical qty.
5. Actual 12, theoretical 10 → `varianceQty === 2`, `varianceCost === 2 * averageCost`.
6. Cancelled order is excluded.

Route check (can live in the same file or a thin integration test):

- Member `GET /api/storage/variance` → 403
- Admin → 200

No new frontend tests in v1.

---

## Isolation

| Unit | Does | Depends on |
|------|------|------------|
| `varianceService` | Compute theoretical, actual, variance, coverage | Order, DishRecipe, ToppingRecipe, StorageExport, StorageItem, unit conversion, `getRecipeForSize` |
| `storageVarianceController` | Auth-scoped HTTP | `varianceService`, `resolveAnalyticsStoreScope`, date helpers |
| `MaterialVariance.jsx` | Render report | Redux slice + dashboard date filter |
| Storage Analytics | Unchanged movement report | Existing analytics controller |

Someone can change how rows are sorted in the UI without touching the service. Someone can change conversion in the service without touching order complete or export create.
