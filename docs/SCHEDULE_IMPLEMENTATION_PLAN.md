# Schedule Module – Implementation Plan

Based on [MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md](./MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md).

---

## Task 1: Normalize memberIds in findConflictsForDate (High)

| Status | Effort | Files |
|--------|--------|-------|
| ✅ Done | Low | `scheduleController.js` |

**Description:** `memberIds.includes(mid)` can fail when callers pass ObjectIds and `mid` is a string (or vice versa). Normalize all IDs to strings for consistent comparison.

**Acceptance criteria:**
- [ ] At start of `findConflictsForDate`, convert memberIds to Set of strings: `new Set(memberIds.map(m => (m && m.toString()).trim()))`
- [ ] Use `memberIdsSet.has(mid)` instead of `memberIds.includes(mid)`
- [ ] Ensure Mongo `$in` query still works (Mongoose accepts ObjectIds or strings)
- [ ] No behavior change; conflicts are correctly detected

---

## Task 2: Align bulk create with single create (Medium)

| Status | Effort | Files |
|--------|--------|-------|
| ✅ Done | Medium | `scheduleController.js` |

**Description:** `bulkCreateSchedules` uses `new Date(date)` and skips cross-store conflict checks. Align with `createSchedule`.

**Acceptance criteria:**
- [x] Use same `parseDate` for bulk create date parsing
- [x] Run conflict check per schedule in bulk (skip creating that schedule, add to errors)
- [x] Validate date with isNaN check

---

## Task 3: Week math consistency (Medium)

| Status | Effort | Files |
|--------|--------|-------|
| ✅ Done | Medium | `scheduleModel.js`, `scheduleController.js`, `dateUtils.js` |

**Description:** Model `pre('save')` uses ISO week; controller used week-from-Jan-1. Unify on ISO week.

**Acceptance criteria:**
- [x] Added `getISOWeek(date)` to dateUtils (returns { year, weekNumber })
- [x] Schedule model pre('save') uses getISOWeek when year/week not set
- [x] createSchedule uses getISOWeek when year/week not provided
- [x] Single source of truth for ISO 8601 week calculation

---

## Progress Log

| Date | Task | Notes |
|------|------|-------|
| 2025-03-23 | Task 1 | Normalized memberIds to Set of strings in findConflictsForDate; use memberIdsSet.has(mid) for robust ObjectId/string comparison |
| 2025-03-23 | Task 2 | bulkCreateSchedules: use parseDate, isNaN validation, findConflictsForDate before assigning members |
| 2025-03-23 | Task 3 | Added getISOWeek to dateUtils; model and createSchedule use it for consistent ISO 8601 year/week |
