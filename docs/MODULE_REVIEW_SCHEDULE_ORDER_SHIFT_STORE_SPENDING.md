# Module Review: Schedule, Order, Shift, Store, Spending

Review of backend modules for consistency, patterns, and optimization opportunities.

---

## 1. Schedule Module

| Layer | Path |
|-------|------|
| Routes | `pos-backend/routes/scheduleRoute.js` |
| Controller | `pos-backend/controllers/scheduleController.js` |
| Model | `pos-backend/models/scheduleModel.js` |
| Service | None (logic in controller) |

### Endpoints
- **Cross-store (no storeContext):** `GET /my-schedule-all`, `GET /all-members-week/:year/:week`, `POST /check-conflicts`
- **Store-scoped:** list/filter by week, date, range, member; CRUD; bulk create; assign/batch-assign/unassign; member view `GET /my-schedule`

### Issues & Opportunities
| Priority | Issue | Suggestion |
|----------|-------|------------|
| High | Week math inconsistency | Model `pre('save')` uses ISO week; `createSchedule` can fall back to simple week-from-Jan-1 when year/week omitted → can disagree |
| High | Conflict helper ID types | `findConflictsForDate` uses `memberIds.includes(mid)` with string `mid`; ObjectIds from callers may not match → conflicts missed |
| Medium | Bulk vs single create | `bulkCreateSchedules` skips cross-store conflict checks; uses `new Date(date)` without `parseDate` → different validation/behavior |
| Low | Controller size (~750 lines) | Extract conflict detection and query builders (e.g. `scheduleUtils.js`) like `orderBillsUtils` |

---

## 2. Order Module

| Layer | Path |
|-------|------|
| Routes | `pos-backend/routes/orderRoute.js` |
| Controller | `pos-backend/controllers/orderController.js` |
| Model | `pos-backend/models/orderModel.js` |
| Service | `services/promotionService.js` |
| Utils | `utils/orderBillsUtils.js` |

### Endpoints
- `POST/GET /api/order`, `GET/PUT/DELETE /api/order/:id`, `PATCH /api/order/:id/items` (all store-scoped)

### Recent Optimizations
- Extracted `calculateOrderBills` and `formatOrderLevelPromotions`
- Batched Dish lookups in `processOrderItems`
- Happy Hour validation in `updateOrderItems`
- `promotionSummary` in update response

### Remaining Opportunities
| Priority | Issue | Suggestion |
|----------|-------|------------|
| Low | Response consistency | Verify all order endpoints return `{ success, data }` shape expected by frontend |
| Low | Further extraction | If controller stays large, extract list/query builders to shared module |

---

## 3. Shift Module

Shifts are schedule rows referencing **ShiftTemplate**. No separate shift route.

| Layer | Path |
|-------|------|
| Template routes | `pos-backend/routes/shiftTemplateRoute.js` |
| Template controller | `pos-backend/controllers/shiftTemplateController.js` |
| Template model | `pos-backend/models/shiftTemplateModel.js` |
| Assignments | Via `scheduleRoute.js` + `scheduleController.js` |

### Endpoints
- **Templates (global):** `GET /active`, CRUD, `PATCH /:id/toggle-active`
- **Assignments:** under `/api/schedule/...` (assign, batch-assign, unassign)

### Issues & Opportunities
| Priority | Issue | Suggestion |
|----------|-------|------------|
| High | Overnight shifts | `durationHours` and overlap logic assume same-day; late-night shifts spanning midnight may be wrong |
| Medium | Delete template | `findByIdAndDelete` does not check for `Schedule` refs → potential orphaned refs |
| Low | Per-store templates | Model has optional `store`; controller creates without store; add store filtering if needed later |

---

## 4. Store Module

| Layer | Path |
|-------|------|
| Routes | `pos-backend/routes/storeRoute.js` |
| Controller | `pos-backend/controllers/storeController.js` |
| Models | `storeModel.js`, `storeUserModel.js` |
| Middleware | `storeContext.js` (uses Store + StoreUser) |

### Endpoints
- `GET /my-stores`, `GET/POST /` (list/create), `GET/PUT/DELETE /:id`, `/:id/members` CRUD

### Issues & Opportunities
| Priority | Issue | Suggestion |
|----------|-------|------------|
| High | `getStoreById` auth gap | Any verified user can fetch any store by ID; no membership check |
| Medium | ID vs header | Member routes use `X-Store-Id`; `getStoreById`/`updateStore` use `:id` in path — document intended usage |
| Low | Soft delete | `deleteStore` sets `isActive: false`; ensure all consumers filter `isActive` |

---

## 5. Spending Module

| Layer | Path |
|-------|------|
| Routes | `pos-backend/routes/spendingRoute.js` |
| Controller | `pos-backend/controllers/spendingController.js` |
| Models | `spendingModel.js` (Spending, SpendingCategory, Vendor) |

### Endpoints
- Store-scoped: CRUD spending, vendors, analytics; list with filters/pagination
- **Categories:** `/categories` — only `isVerifiedUser` (no storeContext, no admin)

### Issues & Opportunities
| Priority | Issue | Suggestion |
|----------|-------|------------|
| High | Category security | Any logged-in user can create/update/delete categories; add `isAdmin` and/or store scoping if needed |
| High | Aggregation store filter | `getSpendingByCategory` / `getSpendingByVendor` may not filter by `store` → cross-tenant data |
| Medium | Schema vs controller | Controller sends `description`, `subcategory`, `taxAmount`, `tags`; reconcile with model schema |
| Low | Controller size (900+ lines) | Split by concern (category, vendor, CRUD, analytics) |

---

## Cross-Module Dependencies

```
Store + StoreUser → storeContext → Schedule, Order, Spending
ShiftTemplate → Schedule (assignments)
User → Store, Schedule
```

---

## Shared Patterns & Gaps

| Area | Status | Notes |
|------|--------|-------|
| Errors | Consistent | `http-errors` + `next(error)`; `globalErrorHandler` |
| Validation | Inconsistent | No shared Joi/Zod; per-controller checks |
| Services | Sparse | Only `promotionService`; Schedule/Spending could use services |
| Tenancy | Mostly OK | `storeContext` used; exceptions: categories, some schedule cross-store |

---

## Suggested Review Order

1. **Store** — auth fix for `getStoreById` (foundational)
2. **Spending** — category security and aggregation store filter
3. **Schedule** — week math and conflict ID normalization
4. **Shift** — overnight shift handling, delete guard
5. **Order** — already optimized; minor consistency checks

---

## Next Steps

For each module, consider:
1. Create an epic-style checklist (like `BE_OPTIMIZATION_EPIC.md`)
2. Fix high-priority issues first
3. Add tests for critical paths
4. Document intended behavior (week math, store scoping, etc.)
