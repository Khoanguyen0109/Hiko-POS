# Spending Module – Implementation Plan

Based on [MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md](./MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md).

---

## Task 1: Add store filter to aggregation statics (High)

| Status | Effort | Files |
|--------|--------|-------|
| ✅ Done | Low | `spendingModel.js`, `spendingController.js` |

**Description:** `getSpendingByCategory`, `getSpendingByVendor`, and `getMonthlySpendingTrend` do not filter by store — they aggregate across all tenants.

**Acceptance criteria:**
- [ ] Add `storeId` parameter to all three statics
- [ ] Add `store: storeId` to the `$match` stage when storeId is provided
- [ ] Update `getSpendingDashboard` to pass `req.store._id` to statics
- [ ] Backward compatible: if storeId is null/undefined, statics can either require it (breaking) or allow cross-store (document as admin-only) — prefer require for tenant isolation

---

## Task 2: Add admin restriction to category CRUD (High)

| Status | Effort | Files |
|--------|--------|-------|
| ✅ Done | Low | `spendingRoute.js` |

**Description:** Category create/update/delete are open to any verified user. Restrict to admin.

**Acceptance criteria:**
- [ ] Add `isAdmin` to `addSpendingCategory`, `updateSpendingCategory`, `deleteSpendingCategory` routes
- [ ] Keep `getSpendingCategories` as is (any verified user can list) or add admin — decide based on product: if categories are global catalog, read may stay open
- [ ] Document: categories are global (no store scoping) and admin-managed

---

## Progress Log

| Date | Task | Notes |
|------|------|-------|
| 2025-03-23 | Task 1 | Added storeId param to getSpendingByCategory, getSpendingByVendor, getMonthlySpendingTrend; dashboard passes req.store._id |
| 2025-03-23 | Task 2 | Added isAdmin to addSpendingCategory, updateSpendingCategory, deleteSpendingCategory routes |
