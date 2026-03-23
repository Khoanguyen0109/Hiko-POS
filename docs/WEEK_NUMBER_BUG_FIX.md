# Week Number Bug Fix - Dec 14 Schedule Issue

## 🐛 The Problem

When you created schedules for Dec 14, 2025:

**What You Sent:**
```json
{
  "date": "2025-12-14",
  "weekNumber": 50
}
```

**What Got Saved:**
```json
{
  "date": "2025-12-13T17:00:00.000Z",  // Dec 14 in Vietnam
  "weekNumber": 51  // ❌ WRONG! Should be 50
}
```

The backend's `pre('save')` hook was **recalculating** the week number and ignoring what the frontend sent.

## ✅ What I Fixed

### Backend Fix: `pos-backend/models/scheduleModel.js`

**Before (Buggy):**
```javascript
if (!this.weekNumber || this.isNew) {  // ❌ Always recalculates for new docs
    this.weekNumber = getISOWeekNumber(date);
}
```

**After (Fixed):**
```javascript
if (!this.weekNumber) {  // ✅ Only calculates if not provided
    this.weekNumber = getISOWeekNumber(date);
}
```

Now the backend **trusts** the week number sent by the frontend!

## 🔧 How to Fix Existing Schedules

You have 2 options:

### Option 1: Delete and Recreate (Recommended)

Since the schedules were just created, the easiest is to:

1. **Refresh your browser** (to load the updated code)
2. Go to Week 50, Dec 14 (Sunday)
3. If you see the schedule, **delete it** (you may need to add a delete feature)
4. **Create a new schedule** for Dec 14
5. It will now save with `weekNumber: 50` ✅

### Option 2: Direct Database Update

If you have MongoDB access, run this query:

```javascript
// Connect to your MongoDB
db.schedules.updateMany(
  {
    date: { 
      $gte: ISODate("2025-12-08T00:00:00.000Z"),
      $lte: ISODate("2025-12-14T23:59:59.999Z")
    }
  },
  {
    $set: { weekNumber: 50 }
  }
);
```

This updates all schedules from Dec 8-14 to have `weekNumber: 50`.

## 🧪 How to Verify It's Fixed

### Test 1: Create New Schedule

1. Refresh browser
2. Go to Week 50, Dec 14
3. Create a new schedule
4. Check the API response - should have `"weekNumber": 50` ✅

### Test 2: Query Week 50 API

```bash
curl http://localhost:3000/api/schedule/week/2025/50
```

Should return schedules for Dec 8-14 (Monday-Sunday).

## 📊 Why This Happened

### The Timezone Dance

1. **Frontend sends:** `"2025-12-14"` (local date)
2. **Backend parses:** Creates date object
3. **Mongoose saves:** `"2025-12-13T17:00:00.000Z"` (with UTC offset)
4. **Pre-save hook:** Recalculates week number
5. **Server timezone:** Might calculate differently than Vietnam time
6. **Result:** Week number mismatch!

### The Fix

- Frontend: Calculates week number in **Vietnam local time**
- Backend: **Accepts** the week number from frontend (no recalculation)
- Result: Consistent week numbers! ✅

## 🎯 Summary

**Root Cause:**
- Backend was recalculating week numbers on every new save
- Ignored the correct week number sent by frontend

**Solution:**
- Removed `|| this.isNew` condition
- Backend now trusts frontend's week calculation

**Action Required:**
- Restart backend server (to load updated schema)
- Delete existing Dec 14 schedules with wrong week number
- Recreate them - they'll save with correct week number

## 🚀 After Restart

Once you restart the backend:

1. ✅ New schedules save with correct week numbers
2. ✅ Frontend queries return correct schedules
3. ✅ Sunday (Dec 14) displays assigned members
4. ✅ No more Week 50/51 confusion!

---

**Need to restart backend:** Yes! The schema change requires a restart.

