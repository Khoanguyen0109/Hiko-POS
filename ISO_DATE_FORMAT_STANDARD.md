# ISO Date Format Standard (YYYY-MM-DD)

## 🎯 Official Standard

**All date handling in this application MUST use ISO 8601 format: `YYYY-MM-DD`**

### Why ISO Format?

1. **Unambiguous:** No confusion between DD/MM/YYYY vs MM/DD/YYYY
2. **Sortable:** Text sorting works correctly (`"2025-01-15"` < `"2025-12-14"`)
3. **Database Friendly:** MongoDB's native date format
4. **JavaScript Native:** Works universally across all systems
5. **International Standard:** ISO 8601 recognized worldwide
6. **No Timezone Issues:** Date-only format avoids timezone confusion

## ✅ Correct Usage

### Frontend

#### 1. When Sending Data to API

```javascript
// ✅ CORRECT - Using ISO format
import { toISODateString } from "../utils/dateUtils";

const createSchedule = async () => {
  const date = new Date();
  
  await api.createSchedule({
    date: toISODateString(date), // "2025-12-14"
    shiftTemplateId: "...",
    memberIds: []
  });
};
```

#### 2. With Date Pickers

```jsx
// ✅ CORRECT - HTML date input uses ISO format natively
<input
  type="date"
  value={dateValue}  // ISO format: "2025-12-14"
  onChange={(e) => setDateValue(e.target.value)}
/>
```

#### 3. Formatting Dates

```javascript
import { formatDate, toISODateString } from "../utils/dateUtils";

// For API requests
const apiDate = toISODateString(new Date()); // "2025-12-14"

// For display to users
const displayDate = formatDate(new Date(), "short"); // "Dec 14"

// For API with formatDate
const apiDate2 = formatDate(new Date(), "iso"); // "2025-12-14"
```

### Backend

#### 1. Accepting Dates

```javascript
// ✅ CORRECT - Parse with ISO priority
const parseDate = (dateString) => {
    // ISO format (YYYY-MM-DD) - RECOMMENDED
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return new Date(year, month - 1, day);
    }
    // ... other formats for backward compatibility
};

// In controller
const scheduleDate = parseDate(req.body.date);
```

#### 2. Returning Dates

```javascript
// ✅ CORRECT - Return as ISO string
res.json({
  date: scheduleDate.toISOString().split('T')[0], // "2025-12-14"
  // OR let Mongoose handle it (returns ISO format by default)
  date: schedule.date // MongoDB stores as ISO
});
```

## ❌ Incorrect Usage

### Don't Use These Formats

```javascript
// ❌ WRONG - Ambiguous (is this Dec 8 or Aug 12?)
date: "08/12/2025"

// ❌ WRONG - Region-specific
date: "12/08/2025"

// ❌ WRONG - Non-standard
date: "2025/12/08"

// ❌ WRONG - Full timestamp when only date needed
date: "2025-12-14T17:00:00.000Z"
```

## 📝 Code Examples

### Frontend: Create Schedule

```javascript
// ✅ CORRECT EXAMPLE
import { toISODateString, getWeekNumber } from "../utils/dateUtils";

const handleCreateSchedule = async (selectedDate, shiftTemplate) => {
  const date = toISODateString(selectedDate); // "2025-12-14"
  const year = selectedDate.getFullYear();
  const weekNumber = getWeekNumber(selectedDate);

  await dispatch(createNewSchedule({
    date, // ISO format
    shiftTemplateId: shiftTemplate._id,
    memberIds: [],
    year,
    weekNumber
  }));
};
```

### Frontend: Display Dates

```javascript
// ✅ CORRECT - Separate display from API format
import { formatDate } from "../utils/dateUtils";

// For users
const displayDate = formatDate(schedule.date, "full"); // "Saturday, December 14, 2025"

// For API
const apiDate = formatDate(schedule.date, "iso"); // "2025-12-14"
```

### Backend: Controller

```javascript
// ✅ CORRECT EXAMPLE
const createSchedule = async (req, res, next) => {
  const { date, shiftTemplateId, memberIds } = req.body;
  
  // Parse date (supports ISO and fallback formats)
  const scheduleDate = parseDate(date);
  
  // Validate
  if (isNaN(scheduleDate.getTime())) {
    return next(createHttpError(400, 
      "Invalid date format. Please use ISO format: YYYY-MM-DD"
    ));
  }
  
  // Normalize to start of day
  scheduleDate.setHours(0, 0, 0, 0);
  
  // Create schedule
  const schedule = new Schedule({
    date: scheduleDate,
    shiftTemplate: shiftTemplateId,
    // ...
  });
  
  await schedule.save();
  res.json({ success: true, data: schedule });
};
```

## 🔧 Utility Functions

### Frontend Utilities (`utils/dateUtils.js`)

```javascript
/**
 * Convert Date object to ISO format string for API requests
 * @param {Date} date - Date object
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const toISODateString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
};

/**
 * Format date with specific format
 * @param {Date|string} date 
 * @param {string} format - "iso", "short", "full", "weekday"
 * @returns {string}
 */
export const formatDate = (date, format = "short") => {
    const d = new Date(date);
    
    if (format === "iso" || format === "YYYY-MM-DD") {
        return d.toISOString().split('T')[0]; // "2025-12-14"
    }
    
    if (format === "short") {
        return d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }); // "Dec 14"
    }
    
    // ... other formats for display
};
```

### Backend Utilities (`controllers/scheduleController.js`)

```javascript
/**
 * Parse date string in multiple formats (ISO preferred)
 * @param {string} dateString 
 * @returns {Date}
 */
const parseDate = (dateString) => {
    // ISO format (YYYY-MM-DD) - RECOMMENDED
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return new Date(year, month - 1, day);
    }
    
    // Fallback formats...
    console.warn(`⚠️  Non-standard date format: ${dateString}`);
    return new Date(dateString);
};
```

## 📅 HTML Date Input

HTML `<input type="date">` **natively uses ISO format**:

```jsx
// ✅ Perfect match!
<input
  type="date"
  value="2025-12-14"  // ISO format
  onChange={(e) => {
    console.log(e.target.value); // "2025-12-14"
    sendToAPI({ date: e.target.value }); // Already ISO!
  }}
/>
```

## 🌍 Internationalization

### Display Format vs API Format

**Always separate display format from API format:**

```javascript
// For users (localized display)
const displayDate = new Date("2025-12-14").toLocaleDateString('en-US'); 
// "12/14/2025" (US)
// "14/12/2025" (UK)

// For API (always ISO)
const apiDate = "2025-12-14"; // Universal
```

## 🔄 Migration Guide

### If You're Using DD/MM/YYYY Format

```javascript
// OLD CODE ❌
const date = "14/12/2025";
await createSchedule({ date });

// NEW CODE ✅
const date = "2025-12-14"; // ISO format
await createSchedule({ date });

// OR with Date object ✅
const dateObj = new Date(2025, 11, 14); // month is 0-indexed
const date = toISODateString(dateObj); // "2025-12-14"
await createSchedule({ date });
```

### Converting Existing Code

```javascript
// If you have DD/MM/YYYY strings
const convertToISO = (ddmmyyyy) => {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const oldDate = "14/12/2025";
const newDate = convertToISO(oldDate); // "2025-12-14"
```

## ✅ Checklist

Before making API requests with dates:

- [ ] Date is in YYYY-MM-DD format
- [ ] Using `toISODateString()` for Date objects
- [ ] HTML date inputs provide ISO format automatically
- [ ] Display dates use `formatDate()` for users
- [ ] API dates use ISO format
- [ ] No timezone information included (date-only)

## 🐛 Troubleshooting

### Problem: "Invalid Date"

```javascript
// ❌ WRONG
new Date("14/12/2025") // Invalid in many locales

// ✅ CORRECT
new Date("2025-12-14") // Always works
```

### Problem: Off-by-one day

```javascript
// ❌ WRONG - Timezone issues
const date = new Date("2025-12-14T00:00:00Z");

// ✅ CORRECT - Local date
const [year, month, day] = "2025-12-14".split('-');
const date = new Date(year, month - 1, day);
```

### Problem: Date looks wrong in database

```javascript
// This is normal! MongoDB stores in UTC
// 2025-12-14 00:00 local → 2025-12-13T17:00:00.000Z (UTC-7)

// Fix: Always use date-only comparison
const startOfDay = new Date(date);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(date);
endOfDay.setHours(23, 59, 59, 999);

Schedule.find({
  date: { $gte: startOfDay, $lte: endOfDay }
});
```

## 📚 Resources

- [ISO 8601 Standard](https://en.wikipedia.org/wiki/ISO_8601)
- [MDN Date Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [HTML Date Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)

## Summary

### The Golden Rule

**API = ISO Format (YYYY-MM-DD)**
**Display = User's Format (localized)**

### Quick Reference

| Use Case | Format | Example |
|----------|--------|---------|
| API Request | `YYYY-MM-DD` | `"2025-12-14"` |
| API Response | `YYYY-MM-DD` | `"2025-12-14"` |
| HTML Input | `YYYY-MM-DD` | `"2025-12-14"` |
| Display (US) | `MM/DD/YYYY` | `"12/14/2025"` |
| Display (EU) | `DD/MM/YYYY` | `"14/12/2025"` |
| Display (Short) | `MMM DD` | `"Dec 14"` |
| Database | `ISODate` | `ISODate("2025-12-14T00:00:00Z")` |

---

**Status:** ✅ ISO Format Standard Implemented

**Updated:** December 14, 2025

**Applies to:** All date handling in frontend and backend

