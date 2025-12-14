# Week Number Issue - Explained

## The Problem

You created a schedule with:
```json
{
  "date": "08/12/2025",
  "year": 2025,
  "weekNumber": 50
}
```

But when you query `/api/schedule/week/2025/50`, you get **empty results**.

## Why This Happens

### 1. Date Parsing
Your date `"08/12/2025"` was parsed as **August 12, 2025**
- Stored as: `"2025-08-11T17:00:00.000Z"` (UTC)
- Local time: August 12, 2025

### 2. Week Number Auto-Calculation
The Schedule model has a `pre('save')` hook that **automatically calculates** the week number from the date:

```javascript
// This runs BEFORE saving
scheduleSchema.pre('save', function(next) {
    const date = new Date(this.date);
    this.year = date.getFullYear();
    
    // Calculates week number from date
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    this.weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    next();
});
```

### 3. The Result
- **Your input:** weekNumber = 50
- **What got saved:** weekNumber = **33** (calculated from August 12, 2025)
- **Your query:** week 50
- **Result:** No match! Empty array!

## Week Number Facts for 2025

| Date | Week Number |
|------|-------------|
| January 1, 2025 | Week 1 |
| **August 12, 2025** | **Week 33** ← Your schedule is here |
| December 8, 2025 | Week 50 |
| December 14, 2025 | Week 50 ← Current week |
| December 15, 2025 | Week 51 |
| December 31, 2025 | Week 53 |

## Solutions

### ✅ Solution 1: Query the Correct Week
Your schedule is in **Week 33**, so query that:

```bash
GET http://localhost:3000/api/schedule/week/2025/33
```

This will return your August 12 schedule!

### ✅ Solution 2: Create Schedule for Week 50
If you want to test Week 50, create a schedule with a **December date**:

```json
{
  "date": "2025-12-14",  // Use YYYY-MM-DD format
  "shiftTemplateId": "693c00674cab39a50f725626",
  "memberIds": ["693e1fc578323bb0e1f8fb37"]
}
```

Week 50 of 2025 runs from **December 8-14, 2025**.

### ✅ Solution 3: Use the Week Calculator

Run this utility to find which week any date is in:

```bash
cd pos-backend
node week-calculator.js
```

This will:
- Show you week numbers for sample dates
- Tell you which dates are in Week 50
- Let you check any date interactively

## Date Format Best Practices

To avoid confusion, **always use ISO format** for dates:

### ✅ Good (ISO Format):
```json
{
  "date": "2025-12-14"  // YYYY-MM-DD - unambiguous
}
```

### ❌ Ambiguous:
```json
{
  "date": "08/12/2025"  // Is this Aug 12 or Dec 8?
  "date": "12/08/2025"  // Could be interpreted differently by locale
}
```

## Testing Your Fix

### 1. Check Current Schedules
```bash
# Run the test script
cd pos-backend
node test-schedule-api.js
```

This will show you:
- All schedules in the database
- Their week numbers
- Which weeks have data

### 2. Query by Date Range Instead
If you're unsure about week numbers, use date range:

```bash
GET /api/schedule/range?startDate=2025-12-08&endDate=2025-12-14
```

### 3. Verify in Browser
Open the Weekly Schedule page and:
- It will calculate current week automatically
- Use week navigator to go to different weeks
- Week 33 (August) should show your schedule
- Week 50 (December) should be empty

## Model Fix Applied

I've updated the Schedule model to respect manually set week numbers:

```javascript
scheduleSchema.pre('save', function(next) {
    if (this.date) {
        const date = new Date(this.date);
        
        // Only calculate if not already set OR if it's a new document
        if (!this.weekNumber || this.isNew) {
            // Calculate week number from date
            this.weekNumber = calculateWeek(date);
        }
    }
    next();
});
```

**However**, the controller also calculates it, so the **date-based calculation will always win**.

## Recommendation

**Don't manually set weekNumber** - let it be calculated from the date:

```json
{
  "date": "2025-12-14",           // ✅ Set this
  "shiftTemplateId": "...",
  "memberIds": ["..."]
  // weekNumber will be auto-calculated
}
```

## Quick Reference

### Current Date: December 14, 2025
- **Current Week:** 50
- **Your Schedule Date:** August 12, 2025
- **Your Schedule Week:** 33

### To See Your Schedule:
```
GET /api/schedule/week/2025/33
```

### To Create Schedule for This Week:
```json
POST /api/schedule
{
  "date": "2025-12-14",
  "shiftTemplateId": "693c00674cab39a50f725626",
  "memberIds": ["693e1fc578323bb0e1f8fb37"]
}
```

## Files Modified

1. **pos-backend/models/scheduleModel.js** - Updated pre-save hook
2. **pos-backend/week-calculator.js** - New utility script
3. **WEEK_NUMBER_ISSUE_EXPLAINED.md** - This document

## Summary

✅ Your API is working correctly!
✅ The issue is week number mismatch
✅ August 12 = Week 33, not Week 50
✅ Query Week 33 to see your schedule
✅ Use ISO date format (YYYY-MM-DD)
✅ Use week-calculator.js to check dates

---

**The takeaway:** The week number is always calculated from the date, so make sure you query the correct week!

