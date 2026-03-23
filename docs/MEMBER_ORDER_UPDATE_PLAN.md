# Member Order Update Feature – Implementation Plan

## Overview

Allow staff members to update orders **only when the order status is `progress`** (In Progress). Once an order moves to `ready`, `completed`, or `cancelled`, it will no longer be editable.

---

## 1. API Plan

### 1.1 Constraint: In-Progress Only

- **Condition:** `orderStatus === 'progress'`
- **Rejection:** Return `400` with message: `"Order can only be updated when status is 'progress' (In Progress)"`

### 1.2 Option A: Extend Existing `PUT /api/order/:id`

Add support for `items`, `customerDetails`, and `bills` to the current update endpoint.

**Request body (new fields):**
```json
{
  "items": [...],           // Full items array (replace)
  "customerDetails": {...}, // Optional
  "orderStatus": "...",
  "paymentMethod": "...",
  "thirdPartyVendor": "...",
  "appliedPromotions": [...]
}
```

- When `items` is provided and order is in progress:
  - Validate and process items (same logic as `addOrder`)
  - Recalculate `bills` (subtotal, promotionDiscount, total, tax, totalWithTax)
  - Update `items` and `bills`

### 1.3 Option B: Dedicated `PATCH /api/order/:id/items` (Recommended)

Keep the main update for status/payment/vendor only. Add a dedicated endpoint for item changes.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `PATCH` | `/api/order/:id/items` | Add/remove/update items (In Progress only) |

**Request body:**
```json
{
  "items": [
    {
      "dishId": "ObjectId",
      "name": "string",
      "pricePerQuantity": number,
      "quantity": number,
      "price": number,
      "originalPricePerQuantity": number,
      "originalPrice": number,
      "note": "string",
      "toppings": [...],
      "variant": {...},
      "category": "string",
      "image": "string"
    }
  ]
}
```

- Full replacement of `items` (like Option A).
- Reuse item validation and processing from `addOrder`.
- Recalculate `bills` and `appliedPromotions` when items change.

### 1.4 API Implementation Steps

1. **Controller: `updateOrderItems`**
   - Load order by id and store.
   - Check `order.orderStatus === 'progress'`.
   - Process `items` with existing `addOrder` item logic (Dish lookup, toppings, variants).
   - Recalculate `bills` (subtotal, promotionDiscount, total, tax, totalWithTax).
   - Save order and return updated data.

2. **Route**
   ```js
   router.route("/:id/items").patch(isVerifiedUser, storeContext, updateOrderItems);
   ```

3. **No role restriction**
   - Any verified user (Admin + Member) can update items when order is in progress.

---

## 2. UI Plan

### 2.1 Entry Point

- **Page:** `OrderDetail` (`/orders/:orderId`)
- **Visibility:** Show “Edit Order” / “Update Items” only when `order.orderStatus === 'progress'`.
- **Hide:** When order is `pending`, `ready`, `completed`, or `cancelled`.

### 2.2 Edit Flow

**Option 1 – Modal**

- “Edit Order” opens a modal.
- Modal content: list of current items + controls for add/remove/change quantity.
- Reuse cart-like UI (dish picker, quantity, notes, toppings).
- Buttons: “Save Changes” and “Cancel”.

**Option 2 – Inline Edit (Recommended)**

- On `OrderDetail`, when in progress, each item shows:
  - Quantity controls (+/−)
  - Remove button
  - Edit note (optional)
- “Add items” opens a drawer/sheet with dish catalog (same as cart flow).
- “Save” recalculates and calls the PATCH endpoint.

### 2.3 UI Components to Create/Extend

| Component | Purpose |
|-----------|---------|
| `OrderItemEditor` | Editable row for quantity, note, remove |
| `OrderAddItemsDrawer` | Add dishes to order (reuse cart/add logic) |
| `OrderEditSummary` | Live totals while editing |
| `EditOrderButton` | Shown only when `orderStatus === 'progress'` |

### 2.4 Data Flow

1. User clicks “Edit Order” → enter edit mode.
2. Local state holds modified items (start from `order.items`).
3. User adds items (from drawer) or changes quantity/removes.
4. “Save” sends `{ items }` to `PATCH /api/order/:id/items`.
5. On success: refresh order, exit edit mode, show success toast.
6. On error: show error, keep edit mode.

### 2.5 UI Considerations

- **Promotions:** Editing items may change totals; decide if promotions are re-applied automatically or require re-selection.
- **Optimistic updates:** Optional; can update Redux after successful API call.
- **Validation:** Ensure at least one item remains before save.

---

## 3. Integration Plan

### 3.1 Frontend HTTP Service

**File:** `pos-frontend/src/https/index.js`

```js
export const updateOrderItems = (orderId, items) => {
  return axiosWrapper.patch(`/api/order/${orderId}/items`, { items });
};
```

### 3.2 Redux Slice

**File:** `pos-frontend/src/redux/slices/orderSlice.js`

- Add thunk: `updateOrderItems`.
- On success: update `currentOrder` (if viewing detail) and the order in `items` and `recentOrders`.

```js
export const updateOrderItems = createAsyncThunk(
  "orders/updateItems",
  async ({ orderId, items }, thunkAPI) => {
    const { data } = await updateOrderItemsAPI(orderId, items);
    return data.data;
  }
);
```

### 3.3 OrderDetail Integration

- Import `updateOrderItems`.
- Add state: `isEditMode`, `editableItems`.
- When `orderStatus === 'progress'`, show Edit Order UI.
- On save, dispatch `updateOrderItems` and handle success/error.

### 3.4 Dish Catalog for Add Items

- Reuse existing dish/category components from cart or POS.
- Fetch dishes from `getAvailableDishes()` or `getDishesByCategory()`.
- When adding a dish, include: dishId, name, pricePerQuantity, quantity, price, etc.

---

## 4. Implementation Checklist

### Phase 1: API
- [ ] Add `updateOrderItems` controller with “in progress” check.
- [ ] Register `PATCH /api/order/:id/items` route.
- [ ] Reuse item validation from `addOrder`.
- [ ] Recalculate bills on item changes.
- [ ] Add tests for `updateOrderItems`.

### Phase 2: Frontend HTTP & Redux
- [ ] Add `updateOrderItems` in `https/index.js`.
- [ ] Add `updateOrderItems` thunk in `orderSlice.js`.
- [ ] Update `items` and `currentOrder` on success.

### Phase 3: UI
- [ ] Show “Edit Order” only when `orderStatus === 'progress'`.
- [ ] Build `OrderItemEditor` (quantity, note, remove).
- [ ] Build or reuse “Add items” flow.
- [ ] Add save/cancel and error handling.
- [ ] Integrate into `OrderDetail`.

### Phase 4: Polish
- [ ] Handle promotions when items change (re-apply or clear).
- [ ] Add loading states and validation.
- [ ] Add confirmation before leaving with unsaved changes.

---

## 5. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Order becomes `ready` while editing | Disable save; show message: “Order is no longer editable” |
| Empty items | Reject; require at least one item |
| Invalid dishId | Reject with validation error |
| Concurrent updates | Last write wins; consider optimistic locking if needed later |

---

## 6. Summary

| Layer | Action |
|-------|--------|
| **API** | Add `PATCH /api/order/:id/items`; allow only when `orderStatus === 'progress'` |
| **UI** | Show editable items and “Add items” only when status is “In Progress” |
| **Integration** | New HTTP + Redux thunk; wire into `OrderDetail` |
