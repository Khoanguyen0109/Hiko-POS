# Week Calculation Fix - Dec 14, 2025 Issue

## Problem
- Calendar was showing incorrect dates for Week 50, 2025
- Clicking on Dec 14 (Sunday) showed modal for Dec 13 (Saturday)
- Dec 14 appeared empty even though it's part of Week 50

## Root Causes

### 1. Incorrect ISO Week Calculation
The original `getWeekDates()` function used a simple calculation that didn't properly implement ISO 8601 week numbering:

```javascript
// OLD (INCORRECT)
const weekStart = new Date(year, 0, 1 + daysOffset);
```

This assumed Week 1 starts on Jan 1, which is wrong. ISO 8601 defines:
- Week 1 is the week containing the first Thursday of the year
- Weeks run Monday to Sunday
- Week 50, 2025 = Dec 8-14, 2025

### 2. Timezone Shift Issue (Critical!)
Even after fixing the ISO calculation, dates were being created in **local timezone** (Vietnam UTC+7), which caused a **1-day shift** when converting to ISO format:

```javascript
// Local timezone (WRONG)
new Date(2025, 11, 14) // Dec 14 in Vietnam timezone
  → toISOString() → "2025-12-13T17:00:00.000Z" ❌ (Dec 13 in UTC!)

// UTC (CORRECT)  
new Date(Date.UTC(2025, 11, 14)) // Dec 14 in UTC
  → toISOString() → "2025-12-14T00:00:00.000Z" ✅
```

When clicking Sunday Dec 14, the date was sent to the backend as "2025-12-13" (Saturday)!

## Solution

### 1. Frontend Fix (`pos-frontend/src/utils/dateUtils.js`)

**Updated `getWeekDates()` function with UTC:**
```javascript
export const getWeekDates = (year, weekNumber) => {
    // ISO week calculation: Week 1 is the week with the first Thursday of the year
    // Use UTC to avoid timezone shifts when converting to ISO format
    const jan4 = new Date(Date.UTC(year, 0, 4)); // ✅ UTC
    
    // Find Monday of week 1
    const dayOfWeek = jan4.getUTCDay(); // ✅ UTC
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setUTCDate(jan4.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // ✅ UTC
    
    // Calculate target week's Monday
    const targetMonday = new Date(mondayOfWeek1);
    targetMonday.setUTCDate(mondayOfWeek1.getUTCDate() + (weekNumber - 1) * 7); // ✅ UTC
    
    // Generate all 7 days of the week (Monday to Sunday)
    const dates = [];
    for (let i = 0; i < 7; i++) {
        // Use getTime() to avoid any date mutation issues
        const date = new Date(targetMonday.getTime() + i * 24 * 60 * 60 * 1000);
        dates.push(date);
    }
    
    return dates;
};
```

**Key Changes:**
- `Date.UTC()` instead of `new Date()` - creates dates in UTC
- `getUTCDay()`, `setUTCDate()`, `getUTCDate()` instead of local methods
- Ensures ISO strings always match the displayed date

### 2. Backend Fix (`pos-backend/models/scheduleModel.js`)

**Updated `pre('save')` hook with ISO week calculation:**
```javascript
// Helper function to calculate ISO 8601 week number
function getISOWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNumber;
}

scheduleSchema.pre('save', function(next) {
    if (this.date) {
        const date = new Date(this.date);
        
        if (!this.year) {
            this.year = date.getFullYear();
        }
        
        if (!this.weekNumber || this.isNew) {
            this.weekNumber = getISOWeekNumber(date);
        }
    }
    next();
});
```

## Verification

Run this test to verify Week 50 dates:

```javascript
const dates = getWeekDates(2025, 50);
// Should output:
// Mon: 2025-12-08
// Tue: 2025-12-09
// Wed: 2025-12-10
// Thu: 2025-12-11
// Fri: 2025-12-12
// Sat: 2025-12-13
// Sun: 2025-12-14  ✅ THIS IS NOW INCLUDED!
```

## Result
- ✅ Week 50 now correctly displays Dec 8-14 (Monday to Sunday)
- ✅ Clicking on Dec 14 shows modal for **Dec 14** (not Dec 13) - **TIMEZONE FIX**
- ✅ ISO format sent to backend: `2025-12-14` (correct!)
- ✅ Both frontend and backend use consistent ISO 8601 week calculation
- ✅ Dec 14 (Sunday) is properly part of Week 50
- ✅ No more timezone-related date shifts

## Next Steps
To see data on Dec 14, you need to create a schedule for that date:
1. Navigate to the Weekly Schedule page
2. Go to Week 50, 2025
3. Click on the Dec 14 (Sunday) cell in any shift row
4. Assign members and save

The date will no longer be empty once a schedule is created for it.

