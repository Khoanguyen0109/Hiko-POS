# Order Module – Implementation Plan

Based on [MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md](./MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md) and [BE_OPTIMIZATION_EPIC.md](./BE_OPTIMIZATION_EPIC.md).

---

## Completed (BE_OPTIMIZATION_EPIC)

- [x] Task 1: Extract `calculateOrderBills` to shared helper
- [x] Task 2: Batch Dish lookups in `processOrderItems`
- [x] Task 3: Add Happy Hour validation to `updateOrderItems`
- [x] Task 5: Add `promotionSummary` to `updateOrderItems` response

---

## Remaining (Low Priority)

### Task 4: Optional appliedPromotions in PATCH body (Medium)

| Status | Effort | Files |
|--------|--------|-------|
| ⬜ To Do | Medium | `orderController.js` |

**Description:** Support optional `appliedPromotions` in `PATCH /api/order/:id/items` so users can change promotions while editing items.

**Acceptance criteria:**
- [ ] Request body may include `appliedPromotions` (optional)
- [ ] If omitted: keep current behavior (re-scale existing)
- [ ] If provided: validate, use for bills, update order
- [ ] Same validation as `updateOrder` for promotions

---

### Task 6: Response consistency audit (Low)

| Status | Effort | Files |
|--------|--------|-------|
| ⬜ To Do | Low | `orderController.js`, frontend https |

**Description:** Verify all order endpoints return `{ success, data }` shape expected by frontend.

**Acceptance criteria:**
- [ ] Audit addOrder, getOrderById, getOrders, updateOrder, updateOrderItems, deleteOrder
- [ ] Ensure consistent `success: true/false`, `data`, `message` where applicable
- [ ] Update frontend if any mismatch

---

## Progress Log

| Date | Task | Notes |
|------|------|-------|
| 2025-03-23 | Tasks 1–3, 5 | Completed via BE_OPTIMIZATION_EPIC |
