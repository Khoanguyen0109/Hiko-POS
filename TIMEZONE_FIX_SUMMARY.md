# Timezone Fix Summary - Vietnam Local Display + ISO API

## 🎯 Requirements
1. **Frontend Display**: Show dates in Vietnam timezone (UTC+7) - users see local dates
2. **API Communication**: Use ISO format (YYYY-MM-DD) for consistency
3. **Date Matching**: Correctly match calendar dates with backend schedules

## 🐛 Previous Issues

### Issue 1: Clicking Sunday showed Saturday's modal
- Calendar was mixing UTC and local timezones
- Date conversion shifted days incorrectly

### Issue 2: Sunday didn't show assigned members
- Backend: Stores `2025-12-13T17:00:00.000Z` (Dec 14 in Vietnam)
- Frontend: Was comparing as UTC `2025-12-13` instead of local `2025-12-14`
- Result: No match found, cell showed empty

## ✅ Solution

### Key Changes

#### 1. `getWeekDates()` - Returns Local Dates
```javascript
// pos-frontend/src/utils/dateUtils.js
export const getWeekDates = (year, weekNumber) => {
    // Work in LOCAL timezone (Vietnam)
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay();
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setDate(jan4.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const targetMonday = new Date(mondayOfWeek1);
    targetMonday.setDate(mondayOfWeek1.getDate() + (weekNumber - 1) * 7);
    
    // Generate dates at noon (local time) to avoid DST issues
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(
            targetMonday.getFullYear(),
            targetMonday.getMonth(),
            targetMonday.getDate() + i,
            12, 0, 0, 0
        );
        dates.push(date);
    }
    
    return dates;
};
```

#### 2. `getLocalDateString()` - Helper for Date Comparison
```javascript
// NEW helper function
export const getLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
```

**Usage**: Convert any date to YYYY-MM-DD in LOCAL timezone
- Calendar date `new Date(2025, 11, 14)` → `"2025-12-14"`
- Backend date `"2025-12-13T17:00:00.000Z"` → `"2025-12-14"` (Vietnam time!)

#### 3. `formatDate()` - API Format Uses Local Date
```javascript
if (format === "iso" || format === "YYYY-MM-DD") {
    // Return date in YYYY-MM-DD format using LOCAL timezone
    return getLocalDateString(d);
}
```

#### 4. `findSchedule()` - Compare Using Local Date Strings
```javascript
// pos-frontend/src/pages/WeeklySchedule.jsx
const findSchedule = (date, shiftTemplateId) => {
    if (!schedules || schedules.length === 0) return null;
    
    // Compare using LOCAL date strings
    const targetDateStr = getLocalDateString(date);
    
    return schedules.find(schedule => {
        // Backend ISO string → local date string
        const scheduleDateStr = getLocalDateString(new Date(schedule.date));
        
        const scheduleTemplateId = typeof schedule.shiftTemplate === 'string' 
            ? schedule.shiftTemplate 
            : schedule.shiftTemplate?._id;
        
        return scheduleDateStr === targetDateStr && scheduleTemplateId === shiftTemplateId;
    });
};
```

## 📊 How It Works

### Flow Example: Dec 14 (Sunday)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CALENDAR DISPLAY (Vietnam Local)                         │
│    User sees: "Sun, Dec 14, 2025"                           │
│    Date object: new Date(2025, 11, 14, 12, 0, 0)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SEND TO API (ISO format)                                 │
│    formatDate(date, "iso") → "2025-12-14"                  │
│    API Request Body: { date: "2025-12-14", ... }           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKEND STORES (with Vietnam offset)                     │
│    Parses "2025-12-14" as midnight Vietnam time             │
│    Stores: "2025-12-13T17:00:00.000Z" (Dec 14 00:00 +07)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. BACKEND RESPONSE (ISO string)                            │
│    { date: "2025-12-13T17:00:00.000Z", ... }               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. FRONTEND COMPARISON (local date strings)                 │
│    Calendar: getLocalDateString(Dec 14 local) = "2025-12-14" │
│    Backend: getLocalDateString("2025-12-13T17:00:00.000Z")   │
│             = "2025-12-14" (converted to Vietnam time!)       │
│    Match! ✅ Cell shows the schedule                         │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Results

### What Works Now

1. **Display in Vietnam Timezone** ✅
   - Users see: Mon Dec 8 → Sun Dec 14
   - Calendar shows correct local dates

2. **API Communication** ✅
   - Frontend sends: `"2025-12-14"`
   - Backend receives and processes correctly

3. **Date Matching** ✅
   - Backend: `"2025-12-13T17:00:00.000Z"` (Dec 14 Vietnam)
   - Frontend: Converts to `"2025-12-14"` for comparison
   - Match found! Cell displays schedule

4. **Modal Shows Correct Date** ✅
   - Click Sunday → Modal shows "Sunday, Dec 14, 2025"
   - No more date shifting

## 🧪 Testing

After refreshing the browser:

1. **Navigate to Week 50, 2025**
   - Should display: Dec 8 (Mon) → Dec 14 (Sun)

2. **Click on any date**
   - Modal shows the SAME date you clicked

3. **Create a schedule for Dec 14**
   - Send date: `"2025-12-14"`
   - Backend stores with Vietnam offset
   - Calendar immediately shows the schedule

4. **Verify matching**
   - Schedules from backend display on correct dates
   - No timezone shift issues

## 📝 Key Principles

1. **Display**: Always use LOCAL timezone (Vietnam)
2. **Storage**: Backend handles timezone conversion
3. **Comparison**: Use `getLocalDateString()` for both calendar and backend dates
4. **API**: Send date-only strings (YYYY-MM-DD), let backend handle time component

## 🎉 Summary

- ✅ Calendar displays in **Vietnam timezone**
- ✅ API communication uses **ISO format** (YYYY-MM-DD)
- ✅ Date matching **works correctly** across timezones
- ✅ No more "click Sunday, see Saturday" issues
- ✅ Schedules display on the **correct dates**

