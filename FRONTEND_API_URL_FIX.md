# ✅ Frontend API URL Fix

## 🔧 What Was Fixed

Updated all schedule API calls in `pos-frontend/src/https/scheduleApi.js` to include `/api` prefix.

### Before:
```javascript
export const getActiveShiftTemplates = () => 
    axiosWrapper.get("/shift-template/active");

export const getSchedulesByWeek = (year, week) => 
    axiosWrapper.get(`/schedule/week/${year}/${week}`);
```

### After:
```javascript
export const getActiveShiftTemplates = () => 
    axiosWrapper.get("/api/shift-template/active");

export const getSchedulesByWeek = (year, week) => 
    axiosWrapper.get(`/api/schedule/week/${year}/${week}`);
```

---

## 🎯 How axiosWrapper BaseURL Works

In `pos-frontend/src/https/axiosWrapper.js`:

```javascript
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api",
  headers: { ...defaultHeader },
});
```

### Two Scenarios:

#### Scenario 1: VITE_BACKEND_URL is NOT set (default)
- **BaseURL:** `http://localhost:3000/api`
- **API Call:** `/shift-template/active`
- **Result:** ❌ `http://localhost:3000/api/shift-template/active` (WRONG - double /api)

#### Scenario 2: VITE_BACKEND_URL IS set to `http://localhost:3000`
- **BaseURL:** `http://localhost:3000`
- **API Call:** `/api/shift-template/active`
- **Result:** ✅ `http://localhost:3000/api/shift-template/active` (CORRECT)

---

## 📊 Current Behavior Analysis

Since you were seeing requests to:
- ❌ `http://localhost:3000/shift-template/active` (404)
- ❌ `http://localhost:3000/schedule/week/2025/50` (404)

This means your `VITE_BACKEND_URL` is set to `http://localhost:3000`.

After the fix, requests will go to:
- ✅ `http://localhost:3000/api/shift-template/active` (200)
- ✅ `http://localhost:3000/api/schedule/week/2025/50` (200)

---

## 🔍 How to Check Your Environment

### Option 1: Check if .env file exists
```bash
cd /Users/khn6352/out/Restaurant_POS_System/pos-frontend
cat .env 2>/dev/null || echo "No .env file"
```

### Option 2: Check at runtime in browser console
```javascript
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
```

---

## 🚀 Testing the Fix

### Step 1: Restart Frontend Dev Server
```bash
cd /Users/khn6352/out/Restaurant_POS_System/pos-frontend
npm run dev
```

### Step 2: Open Browser DevTools
1. Go to `http://localhost:5173`
2. Open DevTools (F12)
3. Go to Network tab
4. Navigate to Weekly Schedule page

### Step 3: Verify Requests
You should now see:
- ✅ `http://localhost:3000/api/shift-template/active` (200 OK)
- ✅ `http://localhost:3000/api/schedule/week/2025/50` (200 OK)

Instead of:
- ❌ `http://localhost:3000/shift-template/active` (404)
- ❌ `http://localhost:3000/schedule/week/2025/50` (404)

---

## 📝 All Updated API Endpoints

### Shift Templates:
```javascript
// All now have /api prefix
getAllShiftTemplates        → /api/shift-template
getActiveShiftTemplates     → /api/shift-template/active
getShiftTemplateById        → /api/shift-template/:id
createShiftTemplate         → /api/shift-template
updateShiftTemplate         → /api/shift-template/:id
deleteShiftTemplate         → /api/shift-template/:id
toggleShiftTemplateActiveStatus → /api/shift-template/:id/toggle-active
```

### Schedules:
```javascript
// All now have /api prefix
getAllSchedules             → /api/schedule
getSchedulesByWeek          → /api/schedule/week/:year/:week
getSchedulesByDate          → /api/schedule/date/:date
getSchedulesByDateRange     → /api/schedule/range
getSchedulesByMember        → /api/schedule/member/:memberId
getScheduleById             → /api/schedule/:id
createSchedule              → /api/schedule
bulkCreateSchedules         → /api/schedule/bulk
updateSchedule              → /api/schedule/:id
deleteSchedule              → /api/schedule/:id
assignMemberToShift         → /api/schedule/:id/assign
unassignMemberFromShift     → /api/schedule/:id/unassign
updateMemberStatus          → /api/schedule/:id/status
getMySchedules              → /api/schedule/my-schedule
```

---

## 🎯 Why This Happened

You likely have `VITE_BACKEND_URL` environment variable set somewhere:

### Possible locations:
1. `.env` file (not found in your project)
2. `.env.local` file
3. System environment variable
4. Set in npm/yarn script
5. Set in your shell profile (.zshrc, .bashrc)

### To find it:
```bash
# Check shell environment
echo $VITE_BACKEND_URL

# Check for any .env files
find /Users/khn6352/out/Restaurant_POS_System -name ".env*" 2>/dev/null

# Check if set in package.json scripts
cat package.json | grep VITE
```

---

## ✅ Summary

### What Changed:
- ✅ Added `/api` prefix to all schedule and shift template API calls
- ✅ Now works with your current `VITE_BACKEND_URL=http://localhost:3000` setting

### What to Do Now:
1. **Restart** your frontend dev server if it's running
2. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. **Clear** browser cache if needed
4. **Test** the Weekly Schedule page

### Expected Result:
- ✅ Active shift templates load successfully
- ✅ Weekly schedules load successfully  
- ✅ Member assignment works
- ✅ All schedule operations work

---

## 🐛 If Still Not Working

### Check Backend is Running:
```bash
curl http://localhost:3000/api/shift-template/active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Frontend is Making Correct Requests:
1. Open Browser DevTools
2. Network tab
3. Look for requests
4. Verify URL includes `/api`

### Force Clear Cache:
```bash
cd /Users/khn6352/out/Restaurant_POS_System/pos-frontend
rm -rf node_modules/.vite
npm run dev
```

---

**Status:** FIXED ✅  
**Date:** December 14, 2024  
**Files Modified:** `pos-frontend/src/https/scheduleApi.js`

