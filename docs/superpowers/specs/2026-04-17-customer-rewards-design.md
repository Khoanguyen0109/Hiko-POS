# Customer Rewards System — Design Spec

**Date:** 2026-04-17  
**Status:** Approved  
**Approach:** Dedicated Reward Service with Log (Approach B)

---

## Overview

A configurable loyalty rewards system where customers earn dish-based rewards across all stores. Staff look up (or auto-create) customers during ordering by phone number, and applicable rewards can be applied to the current order.

### Key Decisions

| Decision | Choice |
|----------|--------|
| Reward programs | Fully configurable by system owner (global) |
| Dish counting | Every individual item counts (quantity-based) |
| When counted | At order creation (enables immediate rewards) |
| Accumulation | Cyclical — tiers repeat (5, 10, 15, 20…) |
| Tier independence | Independent — each tier unlocks separately |
| Redemption | Optional — customer chooses when. Max 1 reward per order |
| Free dish rule | Cheapest dish in the current order |
| Expiration | No expiration |
| Customer identity | Phone is primary ID, global across all stores |
| Reward scope | Global — dishes accumulate across all stores |
| Program management | System owner only |

---

## 1. Data Model

### Customer (modify existing)

The current Customer model is store-scoped. Changes:

- **Remove** `store` field — customers are now global
- **Remove** `point` and `class` — replaced by the reward system
- **Add** `nickname` (String, optional) — for search convenience
- **Add** `totalDishCount` (Number, default 0) — running total for quick lookups
- **Change** `phone` index from compound `(store, phone)` to unique global index on `phone`
- **Keep** `name` (String), `phone` (String, required, unique, 10 digits)

```
Customer {
  name: String,
  phone: { type: String, required: true, unique: true, match: /^\d{10}$/ },
  nickname: String,
  totalDishCount: { type: Number, default: 0 },
  createdAt: Date,
  updatedAt: Date
}
```

### RewardProgram (new)

Global reward program definitions. No `store` field — managed by system owner.

```
RewardProgram {
  name: String,                          // "Buy 5 Get 10% Off"
  description: String,                   // Customer-facing description
  type: enum ["percentage_discount", "free_dish"],
  dishThreshold: Number,                 // 5, 10, etc.
  discountPercent: Number,               // For percentage_discount type (e.g., 10)
  maxFreeDishValue: Number,              // Optional cap on free dish price
  isActive: { type: Boolean, default: true },
  priority: Number,                      // Display ordering
  createdBy: ref User,
  createdAt: Date,
  updatedAt: Date
}
```

### RewardLog (new)

Audit trail for every dish earned and reward action. Source of truth for reward state.

```
RewardLog {
  customer: ref Customer,
  order: ref Order,
  store: ref Store,                      // Where this happened
  type: enum ["dish_earned", "reward_unlocked", "reward_redeemed", "reward_restored", "reward_revoked", "dish_deducted"],
  dishCount: Number,                     // How many dishes (for dish_earned/dish_deducted)
  rewardProgram: ref RewardProgram,      // Which program (for unlock/redeem/restore)
  cumulativeDishCount: Number,           // Running total at time of log
  createdBy: ref User,                   // Staff who processed it
  createdAt: Date
}
```

### Order (modify existing)

- **Add** `customer: { type: ObjectId, ref: 'Customer' }` — optional link to global customer
- **Add** `appliedReward` subdocument:

```
appliedReward: {
  rewardProgram: ref RewardProgram,
  rewardLog: ref RewardLog,              // The redemption log entry
  type: enum ["percentage_discount", "free_dish"],
  discountAmount: Number                 // Calculated discount in currency
}
```

- **Keep** existing `customerDetails` (name/phone/guests) for backward compatibility and display

---

## 2. Service Layer

### RewardService (`pos-backend/services/rewardService.ts`)

All reward logic is isolated here, not in controllers.

**`calculateAvailableRewards(customerId: string)`**
- Reads customer's `totalDishCount`
- For each active RewardProgram, calculates how many times the threshold has been crossed cyclically
- Subtracts already-redeemed rewards (count `reward_redeemed` logs minus `reward_restored` logs for that program) and already-revoked rewards
- Returns array of available rewards with program details

**`earnDishes(customerId, orderId, storeId, dishCount, staffId)`**
- Atomically increments customer's `totalDishCount` using `$inc`
- Writes a `dish_earned` RewardLog entry
- Checks if new thresholds were crossed, writes `reward_unlocked` entries for each

**`redeemReward(customerId, orderId, rewardProgramId, staffId)`**
- Validates the reward is actually available (not already redeemed)
- Writes a `reward_redeemed` RewardLog entry
- Returns discount details (type, amount) to apply to the order

**`deductDishes(customerId, orderId, dishCount, staffId)`**
- Atomically decrements `totalDishCount` using `$inc` with negative value
- Writes a `dish_deducted` RewardLog entry
- If count drops below a threshold with an unredeemed reward, revokes it (writes `reward_revoked` log entry)

**`restoreReward(customerId, orderId, rewardProgramId, staffId)`**
- Called when a cancelled order had a redeemed reward
- Writes a `reward_restored` RewardLog entry, making the reward available again

---

## 3. API Endpoints

### Customer endpoints (modify existing routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/customer/search?q=` | Staff + Store | Search by phone or nickname (global) |
| `POST` | `/api/customer` | Staff + Store | Create customer (phone required, name defaults to phone) |
| `GET` | `/api/customer` | Admin | List all customers with reward stats |
| `GET` | `/api/customer/:id` | Staff + Store | Get customer details + totalDishCount |
| `PUT` | `/api/customer/:id` | Admin | Update customer name/nickname |
| `DELETE` | `/api/customer/:id` | Admin | Delete customer |
| `GET` | `/api/customer/:id/rewards` | Staff + Store | Get available rewards for customer |
| `GET` | `/api/customer/:id/history` | Admin | Full reward log history |

### Reward Program endpoints (new routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/reward-program` | Owner | Create reward program |
| `GET` | `/api/reward-program` | Staff | List all programs (active filter optional) |
| `GET` | `/api/reward-program/:id` | Staff | Get program details |
| `PUT` | `/api/reward-program/:id` | Owner | Update program |
| `PATCH` | `/api/reward-program/:id/toggle-status` | Owner | Activate/deactivate |
| `DELETE` | `/api/reward-program/:id` | Owner | Delete program |

### Order controller integration

Reward earning/redeeming happens inside the existing order flow:

- **`addOrder`** — If `customer` ref is provided, call `earnDishes()` with total item quantity. If `appliedReward` is included, call `redeemReward()` and adjust bills.
- **`updateOrderItems`** — Recalculate dish count delta, call `earnDishes()` or `deductDishes()` accordingly. Recalculate applied reward if items changed.
- **Order cancellation** — Call `deductDishes()` to reverse earned dishes. If a reward was redeemed, call `restoreReward()`.

---

## 4. Frontend UX

### 4a. Ordering Flow — Customer Lookup & Rewards

The right-side cart panel in `MenuOrder` gets a new "Customer & Rewards" section at the top.

**Flow: Type → Tap → Done**

1. **Type** — Staff types phone number or nickname into search input (debounced 300ms)
2. **Tap** — Dropdown shows matching customers with dish count. If no match, shows a single row: the typed phone with a **NEW** badge — "Tap to create & select". One tap auto-creates with phone only (name defaults to phone number).
3. **Done** — Customer is selected. Available rewards appear below with "Use" buttons. Progress bar shows distance to next reward. Staff optionally taps "Use" on one reward — it applies to the bill.

**New components:**

- **`CustomerLookup`** (`pos-frontend/src/components/menu/CustomerLookup.jsx`) — Search input, dropdown with results, auto-create row, selected customer display with dismiss button
- **`RewardSelector`** (`pos-frontend/src/components/menu/RewardSelector.jsx`) — Available rewards list with "Use" buttons, progress bar to next reward, applied reward display

**Modified components:**

- **`Bill.jsx`** — Shows reward discount line when applied (green text, similar to coupon discount)
- **`MenuOrder.jsx`** — Adds `CustomerLookup` and `RewardSelector` above `CartInfo` in the cart panel

**New Redux state:**

- **`rewardSlice`** — Manages reward programs list, customer rewards, applied reward per order
- **`customersSlice` enhancements** — Add `searchCustomers` async thunk, auto-create action

### 4b. Admin Pages

**Reward Programs page** (`/reward-programs`, Owner only)
- Card-based list of all reward programs
- Each card shows: name, type, threshold, discount, active/inactive toggle
- Create/edit form: name, description, type (dropdown), threshold, discount percent or max free dish value
- Delete with confirmation
- Follows existing patterns from `PromotionManager`

**Customers page** (`/customers`, Admin)
- Table view of all customers globally
- Columns: name/avatar, phone, total dishes, available rewards count, times redeemed
- Search by phone or name
- "View" button opens detail with full reward log history
- Edit customer name/nickname inline or in detail view
- Follows existing patterns from `Members` page

**Sidebar additions:**
- "Customers" link under admin section
- "Reward Programs" link under admin section (Owner only)

**New routes:**
- `/customers` → `Customers` page (admin-protected)
- `/reward-programs` → `RewardPrograms` page (owner-protected)

---

## 5. Edge Cases & Error Handling

### Order cancellation
- `deductDishes()` reverses the dish count on the Customer
- If a reward was redeemed on the cancelled order, `restoreReward()` makes it available again
- RewardLog gets `dish_deducted` and `reward_restored` entries for audit

### Order item updates (PATCH)
- Recalculate dish count delta when items are added/removed
- If dishes removed and count drops below a threshold with an unredeemed reward → revoke that reward
- If the applied reward's conditions change (e.g., free dish item was the one removed), recalculate or remove the reward from the order

### Concurrent orders
- `totalDishCount` updates use MongoDB `$inc` (atomic) to prevent race conditions
- Reward availability is re-validated at redemption time — if two orders try to redeem the same reward simultaneously, the second gets a "reward already redeemed" error

### Phone number validation
- Must be exactly 10 digits (existing validation)
- Search is debounced at 300ms to reduce API load
- Search matches phone prefix or name/nickname substring (case-insensitive)

### No active reward programs
- Customer lookup still works (for future use), reward section is hidden
- Orders still link to customers and log dishes — when a program is activated later, historical dishes already count

### New customer (0 dishes)
- Shows "0 dishes" with empty progress bar
- After placing the order, dish count updates immediately
- Staff can see progress on the customer's next visit

### Backward compatibility
- Existing orders without a `customer` ref continue to work normally
- `customerDetails` (inline name/phone/guests) is preserved for display
- The `customer` ref is optional — walk-in orders without customer lookup are unaffected
