# Shift Module – Implementation Plan

Based on [MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md](./MODULE_REVIEW_SCHEDULE_ORDER_SHIFT_STORE_SPENDING.md).

---

## Task 1: Handle overnight shifts in durationHours (High)

| Status | Effort | Files |
|--------|--------|-------|
| ✅ Done | Low | `shiftTemplateModel.js` |

**Description:** `durationHours` assumes `endTime >= startTime`; overnight shifts (e.g. 22:00–06:00) get negative duration.

**Acceptance criteria:**
- [ ] In `pre('save')`, if endMinutes < startMinutes, add 24*60 to endMinutes (shift spans midnight)
- [ ] Duration is always positive
- [ ] Document that overnight shifts are supported
- [ ] Verify conflict/overlap logic in schedule uses this correctly (may need follow-up)

---

## Task 2: Guard delete when Schedules reference template (Medium)

| Status | Effort | Files |
|--------|--------|-------|
| ✅ Done | Low | `shiftTemplateController.js` |

**Description:** Deleting a shift template does not check for existing Schedule documents. Orphaned refs or broken population.

**Acceptance criteria:**
- [ ] In `deleteShiftTemplate` (or equivalent), before delete: `const count = await Schedule.countDocuments({ shiftTemplate: id })`
- [ ] If count > 0, return 400 with message: "Cannot delete: X schedule(s) reference this template"
- [ ] Alternative: soft-deactivate (set isActive: false) instead of hard delete

---

## Progress Log

| Date | Task | Notes |
|------|------|-------|
| 2025-03-23 | Task 1 | Overnight shifts: if endTime <= startTime, add 24h to endMinutes so durationHours is positive |
| 2025-03-23 | Task 2 | Before delete: Schedule.countDocuments({ shiftTemplate }); return 400 if refs exist |
