# Module Implementation Plans – Index

Implementation plans for Store, Spending, Schedule, Shift, and Order modules. Based on [MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md](./MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md).

---

## Plans & Status

| Module | Plan Document | High-Priority Done | Remaining |
|--------|---------------|-------------------|-----------|
| **Store** | [STORE_IMPLEMENTATION_PLAN.md](./STORE_IMPLEMENTATION_PLAN.md) | ✅ getStoreById auth | Task 2: Document ID vs header |
| **Spending** | [SPENDING_IMPLEMENTATION_PLAN.md](./SPENDING_IMPLEMENTATION_PLAN.md) | ✅ Store filter, Category admin | — |
| **Schedule** | [SCHEDULE_IMPLEMENTATION_PLAN.md](./SCHEDULE_IMPLEMENTATION_PLAN.md) | ✅ memberIds, Bulk create, Week math | — |
| **Shift** | [SHIFT_IMPLEMENTATION_PLAN.md](./SHIFT_IMPLEMENTATION_PLAN.md) | ✅ Overnight shifts, Delete guard | — |
| **Order** | [ORDER_IMPLEMENTATION_PLAN.md](./ORDER_IMPLEMENTATION_PLAN.md) | ✅ (via BE_OPTIMIZATION_EPIC) | Task 4: appliedPromotions, Task 6: Audit |

---

## Implementation Summary (2025-03-23)

### Store
- **getStoreById:** Admin can fetch any store; non-admin must be a member (StoreUser). Inactive stores return 404.

### Spending
- **Analytics:** `getSpendingByCategory`, `getSpendingByVendor`, `getMonthlySpendingTrend` now accept `storeId` and filter by store (tenant isolation).
- **Categories:** Create/update/delete restricted to admin (`isAdmin` middleware).

### Schedule
- **findConflictsForDate:** Normalized `memberIds` to a Set of strings; robust comparison for ObjectId vs string from different callers.

### Shift
- **durationHours:** Overnight shifts (e.g. 22:00–06:00) now correctly add 24h when endTime ≤ startTime.
- **deleteShiftTemplate:** Returns 400 if Schedule documents reference the template; suggests deactivating instead.

---

## Suggested Next Steps

1. **Order Task 4:** Optional `appliedPromotions` in PATCH items body.
4. **Store Task 2:** Add route comments for ID vs header usage.
5. Add integration tests for Store auth, Spending dashboard store filter, Shift delete guard.
