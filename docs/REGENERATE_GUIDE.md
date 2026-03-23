# 🔄 Clear & Regenerate Schedule Data

## Why Do This?

The current schedules have incorrect `weekNumber` values (some are Week 51 instead of 50), causing Sunday to appear empty. Regenerating will create fresh schedules with correct week numbers.

## ✨ What This Will Do

1. **Delete** all existing Week 50 schedules
2. **Create** new schedules for Dec 8-14 (Monday-Sunday)
3. **Ensure** all schedules have `weekNumber: 50` ✅
4. **Include** Sunday (Dec 14) with correct week number

## 🚀 Step-by-Step Instructions

### Step 1: Restart Backend (Important!)

First, restart the backend to load the fixed schema:

**In Terminal 3 (Backend Terminal):**

1. Press `Ctrl+C` to stop the server
2. Wait for it to stop
3. Run:
   ```bash
   cd /Users/khn6352/out/Restaurant_POS_System/pos-backend
   npm run dev
   ```
4. Wait for: `✅ MongoDB Connected Successfully!`

### Step 2: Open Browser Console

1. **Open your app** at `http://localhost:5173`
2. **Login as admin**
3. **Press F12** (or Right-click → Inspect)
4. **Click "Console" tab**

### Step 3: Run the Regenerate Script

1. **Open the file:** `CLEAR_AND_REGENERATE.js`
2. **Select ALL the code** (Ctrl+A or Cmd+A)
3. **Copy it** (Ctrl+C or Cmd+C)
4. **Paste into browser console**
5. **Press Enter**

### Step 4: Watch the Magic! ✨

The script will:

```
🚀 Starting Schedule Clear & Regenerate...
✅ Auth token found

📋 STEP 1: Fetching all schedules...
Found 18 schedules in Week 50
🗑️  Deleting all Week 50 schedules...
✅ Deleted: ...
✅ Deleted: ...
...

📋 STEP 2: Regenerating Week 50 schedules...
Found 3 shift templates: Morning, Afternoon, Evening
Found 2 members

🗓️  Creating schedules for Week 50 (Dec 8-14)...
✅ Monday 2025-12-08 - Morning (Week 50)
✅ Monday 2025-12-08 - Afternoon (Week 50)
✅ Monday 2025-12-08 - Evening (Week 50)
✅ Tuesday 2025-12-09 - Morning (Week 50)
...
✅ Sunday 2025-12-14 - Morning (Week 50)  ← SUNDAY IS INCLUDED!
✅ Sunday 2025-12-14 - Afternoon (Week 50)
✅ Sunday 2025-12-14 - Evening (Week 50)

🎉 COMPLETE!
✅ Created: 21 schedules
❌ Errors: 0
```

You'll see an alert: **"✅ Success! Created X schedules for Week 50"**

### Step 5: Refresh Browser

Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)

### Step 6: Verify & Assign Members

1. **Navigate to** Weekly Schedule
2. **Go to Week 50** (Dec 8-14, 2025)
3. **You should see:**
   - All 7 days (Monday to Sunday) ✅
   - All shift rows (Morning/Afternoon/Evening) ✅
   - All cells empty (ready to assign) ✅
   - **Sunday (Dec 14) is now visible!** 🎉

4. **Click any cell** to assign members
5. **Verify Sunday works:**
   - Click Sunday cell
   - Modal shows "Sunday, December 14, 2025" ✅
   - Assign members
   - Save
   - Members appear on Sunday! ✅

## 🎯 Expected Results

### Before:
- 18 schedules (some with wrong week numbers)
- Sunday missing or not showing
- Week 51 confusion

### After:
- 21 schedules (7 days × 3 shifts)
- All have `weekNumber: 50` ✅
- Sunday (Dec 14) included ✅
- Ready to assign members

## 🐛 Troubleshooting

**"No auth token found!"**
- Make sure you're logged in
- Refresh the page and try again

**"No shift templates found!"**
- You need to create shift templates first
- Go to "Manage Templates" and create Morning/Afternoon/Evening shifts

**Script runs but nothing changes:**
- Make sure backend was restarted
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors

**Sunday still empty after assigning:**
- Check DevTools → Network → POST /api/schedule
- Verify response shows `"weekNumber": 50`
- If not, backend might not have restarted properly

## 📊 What Gets Created

For each of 7 days (Mon-Sun) × 3 shifts:

```json
{
  "date": "2025-12-14",           // Sunday!
  "shiftTemplateId": "...",       // Morning/Afternoon/Evening
  "memberIds": [],                // Empty, ready to assign
  "year": 2025,
  "weekNumber": 50,               // ✅ CORRECT!
  "notes": "Week 50 schedule - Sunday"
}
```

## ✅ Success Checklist

- [ ] Backend restarted
- [ ] Script ran successfully
- [ ] Browser refreshed
- [ ] Week 50 shows all 7 days
- [ ] Sunday (Dec 14) is visible
- [ ] Can click Sunday cells
- [ ] Can assign members to Sunday
- [ ] Members show up on Sunday
- [ ] No more Week 51 confusion! 🎊

---

**Time Required:** ~2 minutes

**Difficulty:** Easy (just copy/paste!)

**Result:** Clean, working Week 50 schedule with Sunday included! 🎉

