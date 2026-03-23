# Week 50 Setup Guide - View Assigned Members

## Problem
You want to see assigned members when calling:
```
GET http://localhost:3000/api/schedule/week/2025/50
```

But it returns empty data because:
1. Your existing schedule is in Week 33 (August 12, 2025)
2. Week 50 is December 8-14, 2025
3. No schedules exist for Week 50 yet

## Solution: Create Test Data for Week 50

### Step 1: Create Week 50 Schedules

Run this command to automatically create schedules with assigned members:

```bash
cd pos-backend
node create-week50-schedules.js
```

This will:
- ✅ Create schedules for December 8-14, 2025 (Week 50)
- ✅ Assign 1-3 random members to each shift
- ✅ Use all your active shift templates
- ✅ Skip if schedules already exist

**Expected Output:**
```
✅ Connected to MongoDB
✅ Found admin: admin
✅ Found 3 shift template(s):
   1. Morning (06:30 - 11:30)
   2. Afternoon (11:30 - 17:30)
   3. Evening (17:30 - 22:30)
✅ Found 5 active member(s):
   1. test1 (User)
   2. John Doe (Staff)
   ...

📅 Creating Schedules...

📆 Monday, 2025-12-08
   ✅ Morning - Created with 2 member(s): test1, John Doe
   ✅ Afternoon - Created with 1 member(s): Jane Smith
   ...

📊 Summary:
   ✅ Created: 21 schedule(s)
   📅 Week: 50 of 2025
```

### Step 2: Test the API

Run the test script to verify:

```bash
node test-week50-api.js
```

**Expected Output:**
```
🧪 Testing Week 50 API Endpoint
📞 Simulating: GET /api/schedule/week/2025/50

📊 Response: Found 21 schedule(s)

📅 Monday, 2025-12-08
──────────────────────────────────────────
   ⏰ Morning (06:30 - 11:30)
      👥 Assigned Members: 2
         1. 📋 test1 (User) - scheduled
         2. 📋 John Doe (Staff) - scheduled
   ...

✅ SUCCESS! All member data is populated correctly.
```

### Step 3: Test via API

Use curl or Postman:

```bash
curl -X GET "http://localhost:3000/api/schedule/week/2025/50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 21,
  "data": [
    {
      "_id": "...",
      "date": "2025-12-08T00:00:00.000Z",
      "shiftTemplate": {
        "_id": "693c00674cab39a50f725626",
        "name": "Morning",
        "startTime": "06:30",
        "endTime": "11:30",
        "color": "#f6b100"
      },
      "assignedMembers": [
        {
          "member": {
            "_id": "693e1fc578323bb0e1f8fb37",
            "name": "test1",
            "email": "ss@gmail.com",
            "phone": "0908578101",
            "role": "User"
          },
          "status": "scheduled",
          "notes": "",
          "_id": "..."
        }
      ],
      "year": 2025,
      "weekNumber": 50,
      "notes": "Week 50 schedule - Monday"
    }
  ]
}
```

### Step 4: Test in Browser

1. **Navigate to Weekly Schedule:**
   - Go to: `http://localhost:5173/schedule` (or your frontend URL)

2. **Check Current Week:**
   - The page should load the current week automatically
   - December 14, 2025 = Week 50

3. **View Assigned Members:**
   - Each schedule cell should show:
     - Shift name and time
     - Assigned member names
     - Member count
   - Members are color-coded by status

4. **Use Week Navigator:**
   - Click arrows to navigate between weeks
   - Week 50 should show your test data
   - Week 33 should show your August schedule

## Manual Creation (Alternative)

If you prefer to create schedules manually via API:

### Create Single Schedule

```bash
POST http://localhost:3000/api/schedule
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "date": "2025-12-14",
  "shiftTemplateId": "693c00674cab39a50f725626",
  "memberIds": ["693e1fc578323bb0e1f8fb37"]
}
```

### Assign Member to Existing Schedule

```bash
PATCH http://localhost:3000/api/schedule/:scheduleId/assign
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "memberId": "693e1fc578323bb0e1f8fb37"
}
```

## Understanding Week Numbers

### Week 50 of 2025
- **Date Range:** December 8-14, 2025
- **Days:** Monday to Sunday

### Your Previous Schedule
- **Date:** August 12, 2025
- **Week Number:** 33 (auto-calculated)
- **Query:** `GET /api/schedule/week/2025/33`

### Current Date (December 14, 2025)
- **Week Number:** 50
- **This is why Week 50 is relevant!**

## Verify Week Numbers

Run the week calculator utility:

```bash
node week-calculator.js
```

This shows:
- Which dates are in which weeks
- Interactive date-to-week lookup
- Week 50 date range

## Troubleshooting

### Issue: No members found
**Cause:** No active members in database
**Solution:**
```bash
# Create test members via API or frontend
POST /api/member
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "Staff"
}
```

### Issue: No shift templates found
**Cause:** No active shift templates
**Solution:** Create shift templates via frontend or API

### Issue: Empty assignedMembers array
**Cause:** Members exist but not assigned
**Solution:** Run `create-week50-schedules.js` or manually assign via API

### Issue: Members show as IDs not names
**Cause:** Populate not working
**Solution:** 
1. Check Schedule model has `ref: "User"`
2. Verify member ObjectIds are valid
3. Check backend logs for errors

## Quick Commands Reference

```bash
# Backend directory
cd pos-backend

# 1. Create Week 50 schedules with members
node create-week50-schedules.js

# 2. Test the API endpoint
node test-week50-api.js

# 3. Check week numbers
node week-calculator.js

# 4. Test schedule API (general)
node test-schedule-api.js

# 5. Start backend server
npm run dev
```

## Expected Frontend View

When you open the Weekly Schedule page for Week 50, you should see:

```
┌─────────────────────────────────────────────┐
│ Monday, Dec 8, 2025                         │
├─────────────────────────────────────────────┤
│ Morning (06:30 - 11:30)                     │
│ 👤 test1                                    │
│ 👤 John Doe                                 │
│                                              │
│ Afternoon (11:30 - 17:30)                   │
│ 👤 Jane Smith                               │
│ +1 more                                      │
└─────────────────────────────────────────────┘
```

## Success Criteria

✅ `create-week50-schedules.js` runs without errors
✅ `test-week50-api.js` shows populated member data
✅ API endpoint returns schedules with assignedMembers
✅ Each member object has `_id`, `name`, `role` fields
✅ Frontend calendar displays member names
✅ No "Unknown" members showing

## Files Created

1. **create-week50-schedules.js** - Creates test data
2. **test-week50-api.js** - Tests API endpoint
3. **week-calculator.js** - Week number utility
4. **WEEK50_SETUP_GUIDE.md** - This guide

## Summary

1. ✅ Week 50 = December 8-14, 2025
2. ✅ Run `node create-week50-schedules.js` to create test data
3. ✅ Run `node test-week50-api.js` to verify
4. ✅ Query `GET /api/schedule/week/2025/50`
5. ✅ See assigned members in response!

---

**Next Steps:**
1. Run the create script
2. Test the API
3. Verify in browser
4. Start building your actual schedule! 🎉

