# BE Optimization Epic: Member Order Update

Epic to implement backend optimizations from [BE_OPTIMIZATION_SUGGESTIONS.md](./BE_OPTIMIZATION_SUGGESTIONS.md) one by one.

---

## Epic Overview

| Metric | Value |
|--------|-------|
| Total tasks | 9 |
| Estimated effort | ~2–3 days |
| Dependencies | Task 1 should be done first (others can follow in any order) |

---

## Task 1: Extract `calculateOrderBills` to Shared Helper

| Field | Value |
|-------|-------|
| **Status** | ✅ Done |
| **Effort** | Medium |
| **Dependencies** | None |
| **Files** | `pos-backend/utils/orderBillsUtils.js` (new), `orderController.js` |

**Description:** Create a shared utility that computes `{ subtotal, promotionDiscount, total, tax, totalWithTax }` from processed items and applied promotions. Replace duplicated logic in `addOrder`, `updateOrder`, and `updateOrderItems`.

**Acceptance criteria:**
- [ ] `pos-backend/utils/orderBillsUtils.js` exists with `calculateOrderBills(processedItems, appliedPromotions, tax)`
- [ ] Handles: order-level only, item-level only, mixed, no promotions
- [ ] `addOrder` uses it
- [ ] `updateOrder` uses it (for promotion updates)
- [ ] `updateOrderItems` uses it
- [ ] Existing order tests still pass

---

## Task 2: Batch Dish Lookups in `processOrderItems`

| Field | Value |
|-------|-------|
| **Status** | ✅ Done |
| **Effort** | Low |
| **Dependencies** | None |
| **Files** | `orderController.js` |

**Description:** Replace per-item `Dish.findById()` calls with a single batched `Dish.find({ _id: { $in: [...] } })` when items need category lookup.

**Acceptance criteria:**
- [ ] Collect all dishIds needing category (missing or 'Unknown')
- [ ] Single `Dish.find().populate('category', 'name')` query
- [ ] Use a Map for O(1) lookup when processing items
- [ ] No behavior change; existing tests pass

---

## Task 3: Add Happy Hour Validation to `updateOrderItems`

| Field | Value |
|-------|-------|
| **Status** | ✅ Done |
| **Effort** | Low |
| **Dependencies** | None |
| **Files** | `orderController.js`, `promotionService.js` |

**Description:** When items include happy hour promotions, call `PromotionService.validateHappyHourPricing()` before saving. Reject with 400 if validation fails.

**Acceptance criteria:**
- [ ] Detect happy hour items (`isHappyHourItem` or `promotionsApplied` with happy_hour)
- [ ] Call `PromotionService.validateHappyHourPricing(processedItems, appliedPromotions)`
- [ ] Return 400 with validation message if invalid
- [ ] No change when no happy hour items

---

## Task 4: Optional `appliedPromotions` in `PATCH /:id/items` Body

| Field | Value |
|-------|-------|
| **Status** | ⬜ To Do |
| **Effort** | Medium |
| **Dependencies** | Task 1 (recommended) |
| **Files** | `orderController.js` |

**Description:** Support optional `appliedPromotions` in the PATCH request body. If provided, validate and use for bill calculation; if omitted, keep current behavior (re-scale existing promotions).

**Acceptance criteria:**
- [ ] Request body may include `appliedPromotions` (optional)
- [ ] If omitted: current behavior (keep & re-scale)
- [ ] If provided: validate (same as `updateOrder`), then use for bills
- [ ] Update docs or plan if needed

---

## Task 5: Add `promotionSummary` to `updateOrderItems` Response

| Field | Value |
|-------|-------|
| **Status** | ✅ Done |
| **Effort** | Low |
| **Dependencies** | None |
| **Files** | `orderController.js` |

**Description:** Return `promotionSummary` in the response for `updateOrderItems`, matching the shape from `addOrder`.

**Acceptance criteria:**
- [ ] Response includes `promotionSummary: { totalOriginalAmount, totalDiscountAmount, totalFinalAmount, ... }`
- [ ] Matches structure from `addOrder` response

---

## Task 6: Add `customerDetails` Update Path

| Field | Value |
|-------|-------|
| **Status** | ⬜ To Do |
| **Effort** | Low |
| **Dependencies** | None |
| **Files** | `orderController.js`, `orderRoute.js` (if new route) |

**Description:** Allow updating `customerDetails` (name, phone, guests) for in-progress orders. Either extend `PUT /:id` or add `PATCH /:id/customer`.

**Acceptance criteria:**
- [ ] In-progress orders can have customerDetails updated
- [ ] Validate: name/phone string trim, guests number
- [ ] Reject when order status is not `progress` (if using dedicated route)

---

## Task 7: Add `updatedBy` Audit Field

| Field | Value |
|-------|-------|
| **Status** | ⬜ To Do |
| **Effort** | Low |
| **Dependencies** | None |
| **Files** | `orderModel.js`, `orderController.js` |

**Description:** Add `updatedBy: { userId, userName }` to the Order model and set it when `updateOrderItems` (and optionally `updateOrder`) runs.

**Acceptance criteria:**
- [ ] Order schema has `updatedBy: { userId, userName }` (optional)
- [ ] `updateOrderItems` sets `updatedBy` from `req.user`
- [ ] Optionally `updateOrder` sets it too

---

## Task 8: Reduce Console Logging in Production

| Field | Value |
|-------|-------|
| **Status** | ⬜ To Do |
| **Effort** | Low |
| **Dependencies** | None |
| **Files** | `orderController.js`, optionally `promotionService.js` |

**Description:** Guard debug `console.log` calls so they only run in development, or introduce a simple logger with levels.

**Acceptance criteria:**
- [ ] Debug logs (e.g. "Backend calculation debug") not emitted in production
- [ ] Use `NODE_ENV` or logger level to control

---

## Task 9: Optimistic Locking (Later / Optional)

| Field | Value |
|-------|-------|
| **Status** | ⬜ To Do / Deferred |
| **Effort** | Medium |
| **Dependencies** | None |
| **Files** | `orderModel.js`, `orderController.js` |

**Description:** Add a `version` field and require it in PATCH requests. Return 409 Conflict if version mismatch (concurrent edit).

**Acceptance criteria:**
- [ ] Order has `version` (number, default 1)
- [ ] PATCH body may include `version`; if present, validate match
- [ ] On mismatch: 409 with message
- [ ] On success: increment version

---

## Suggested Order

1. **Task 1** (Extract bill calculation) — foundation for consistency  
2. **Task 2** (Batch Dish lookups) — quick win, no behavior change  
3. **Task 3** (Happy Hour validation) — data integrity  
4. **Task 5** (promotionSummary) — quick consistency fix  
5. **Task 4** (appliedPromotions in body) — uses Task 1  
6. **Task 6** (customerDetails) — completeness  
7. **Task 7** (updatedBy) — audit  
8. **Task 8** (logging) — ops  
9. **Task 9** (optimistic locking) — defer until needed  

---

## Progress Log

| Date | Task | Notes |
|------|------|-------|
| 2025-03-23 | Task 1 | Extracted `calculateOrderBills` and `formatOrderLevelPromotions` to `orderBillsUtils.js`. Refactored addOrder, updateOrder, updateOrderItems. All 13 order tests pass. |
| 2025-03-23 | Task 2 | Batched Dish lookups in processOrderItems. Single `Dish.find().populate('category')` instead of N+1 per-item queries. |
| 2025-03-23 | Task 3 | Added Happy Hour validation to updateOrderItems. Fixed PromotionService.validateHappyHourPricing to handle undefined appliedToItems. |
| 2025-03-23 | Task 5 | Added promotionSummary to updateOrderItems response for consistency with addOrder. |

---

## Completion Checklist

- [x] Task 1
- [x] Task 2
- [x] Task 3
- [ ] Task 4
- [x] Task 5
- [ ] Task 6
- [ ] Task 7
- [ ] Task 8
- [ ] Task 9 (optional)
