# Delete & Recreate Sunday Schedule - Step by Step

## 📋 Current Situation

**Sunday (Dec 14) schedule exists but:**
- Schedule ID: `693e268a7af72cbf2c2ed7ac`
- Week Number: **51** (WRONG! Should be 50)
- Not showing in Week 50 calendar view

## ✅ Solution Steps

### Step 1: Restart Backend (IMPORTANT!)

Stop and restart the backend to load the fixed schema:

```bash
# In backend terminal (Terminal 3):
# Press Ctrl+C to stop

# Then restart:
cd /Users/khn6352/out/Restaurant_POS_System/pos-backend
npm run dev
```

Wait for: `✅ MongoDB Connected Successfully!`

### Step 2: Delete Old Sunday Schedule via Frontend

**Option A: Use Browser DevTools**

1. **Open your app** at `http://localhost:5173`
2. **Login** as admin
3. **Open DevTools** (F12 or Right-click → Inspect)
4. Go to **Console** tab
5. **Paste this code:**

```javascript
// Get your auth token from localStorage
const token = localStorage.getItem('accessToken');

// Delete the old Sunday schedule
fetch('http://localhost:3000/api/schedule/693e268a7af72cbf2c2ed7ac', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Deleted:', data);
  alert('Sunday schedule deleted! Now refresh and create a new one.');
})
.catch(err => console.error('❌ Error:', err));
```

6. **Press Enter**
7. Wait for success message

**Option B: Use Terminal with Token**

```bash
# Get your token from the browser:
# 1. Open DevTools (F12)
# 2. Go to Application/Storage → Local Storage → http://localhost:5173
# 3. Copy the value of 'accessToken'

# Then run:
curl -X DELETE http://localhost:3000/api/schedule/693e268a7af72cbf2c2ed7ac \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Step 3: Refresh Browser

Press `Ctrl+R` or `Cmd+R` to reload the frontend with updated code.

### Step 4: Create New Sunday Schedule

1. **Navigate to Weekly Schedule** page
2. **Confirm you're on Week 50** (Dec 8-14, 2025)
3. **Look at Sunday column** (Dec 14)
4. **Click on Sunday cell** in any shift (Morning/Afternoon/Evening)
5. **Assign members** in the modal
6. **Save**

The new schedule will save with **`weekNumber: 50`** ✅

### Step 5: Verify

**Check the response:**
- Look in DevTools → Network tab
- Find the POST request to `/api/schedule`
- Check response shows: `"weekNumber": 50` ✅

**Check the calendar:**
- Sunday (Dec 14) should now show the assigned members ✅
- Colored badges with member names appear ✅

## 🎯 Expected Results

### Before Fix:
```json
{
  "date": "2025-12-13T17:00:00.000Z",
  "weekNumber": 51,  // ❌ WRONG
  ...
}
```

### After Fix:
```json
{
  "date": "2025-12-13T17:00:00.000Z",
  "weekNumber": 50,  // ✅ CORRECT
  ...
}
```

### Calendar View:
- **Sunday Dec 14** shows assigned members with colored badges ✅
- Clicking Sunday shows correct date in modal ✅
- Query `/api/schedule/week/2025/50` includes Sunday ✅

## 🐛 Troubleshooting

**If Sunday still doesn't show:**

1. **Check backend was restarted** - Look for restart message in terminal
2. **Clear browser cache** - Hard refresh with Ctrl+Shift+R
3. **Verify week number** - Check DevTools Network response
4. **Check console logs** - Look for any errors

**If you get "Schedule already exists":**
- The old schedule wasn't deleted
- Try deleting via DevTools console again
- Or create schedule for a different shift (e.g., if Morning exists, try Afternoon)

## ✨ Quick Summary

```
1. Restart backend       → Loads fixed schema
2. Delete old schedule   → Removes Week 51 schedule  
3. Refresh browser       → Loads updated frontend
4. Create new schedule   → Saves with Week 50 ✅
5. Verify                → Sunday shows members! 🎉
```

---

**Need Help?**
- Backend not restarting? Check for port 3000 conflicts
- Can't delete? Make sure you're logged in as Admin
- Still empty? Check browser console for errors

