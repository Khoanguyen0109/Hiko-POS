# Store Module – Implementation Plan

Based on [MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md](./MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md).

---

## Task 1: Add membership check to getStoreById (High)

| Status | Effort | Files |
|--------|--------|-------|
| ✅ Done | Low | `storeController.js` |

**Description:** Any verified user can currently fetch any store by ID. Restrict to admins or store members.

**Acceptance criteria:**
- [ ] Admin can fetch any store by ID
- [ ] Non-admin can fetch only if they are a member of that store (StoreUser exists)
- [ ] Return 403 if non-admin attempts to access a store they don't belong to
- [ ] Return 404 if store not found or inactive

---

## Task 2: Document ID vs header usage (Medium)

| Status | Effort | Files |
|--------|--------|-------|
| ⬜ To Do | Low | `storeRoute.js` (comments) |

**Description:** Clarify when to use `:id` in path vs `X-Store-Id` header.

**Acceptance criteria:**
- [ ] Add route comments: `getStoreById`/`updateStore` use `:id` for admin or member accessing specific store; member routes use header for "current" store
- [ ] Optional: add JSDoc on controller functions

---

## Progress Log

| Date | Task | Notes |
|------|------|-------|
| 2025-03-23 | Task 1 | Added membership check: non-admins must be StoreUser of the store; also filter inactive stores |
