# Schedule API Debug Guide

## Issue
The `/api/schedule/week/:year/:week` endpoint is not showing assigned member data properly on the calendar.

## Solution Implemented

### 1. Backend Changes

#### Added Debug Logging (`pos-backend/controllers/scheduleController.js`)
- Added console logging to `getSchedulesByWeek` function
- Shows number of schedules found
- Displays sample schedule with assignedMembers structure

The backend already has correct populate:
```javascript
.populate('assignedMembers.member', '-password')
```

This should populate the `member` field within each `assignedMembers` array item.

### 2. Frontend Changes

#### Updated ScheduleCell Component (`pos-frontend/src/components/schedule/ScheduleCell.jsx`)
- Enhanced member data extraction logic
- Added support for multiple data structures:
  - Populated member object: `{ member: { _id, name, email, ... }, status }`
  - Member ID string: `{ member: "objectId", status }`
  - Direct member object: `{ _id, name, ... }`
- Added status-based color coding
- Improved debug logging
- Added PropTypes validation

## Testing the API

### Manual API Test

1. **Get a Week's Schedule**
```bash
# Replace TOKEN with your JWT token
# Replace YEAR and WEEK with current values (e.g., 2025, 50)

curl -X GET "http://localhost:3000/api/schedule/week/2025/50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

2. **Check Response Structure**
The response should look like:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "date": "2025-12-14T00:00:00.000Z",
      "shiftTemplate": {
        "_id": "...",
        "name": "Morning Shift",
        "startTime": "08:00",
        "endTime": "16:00",
        "color": "#4ECDC4"
      },
      "assignedMembers": [
        {
          "member": {
            "_id": "689dfd65898b447034ceaa16",
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "1234567890",
            "role": "Staff"
          },
          "status": "scheduled",
          "notes": "",
          "_id": "..."
        }
      ],
      "year": 2025,
      "weekNumber": 50,
      "notes": ""
    }
  ]
}
```

### Check Backend Logs

After making the API call, check your backend terminal for debug output:
```
📅 Week Schedules Found: 5
📋 Sample Schedule: {
  id: ...,
  date: ...,
  assignedMembers: [...],
  assignedMembersCount: 2
}
```

### Check Frontend Console

In the browser console, you should see:
```
🔍 ScheduleCell Debug: {
  scheduleId: "...",
  assignedMembers: [...],
  assignedMembersLength: 2,
  firstMember: { member: {...}, status: "scheduled" },
  members: [...]
}
```

## Common Issues & Solutions

### Issue 1: assignedMembers is empty array
**Cause:** No members assigned to schedule
**Solution:** Assign members using the assignment modal

### Issue 2: member field is not populated (shows ObjectId string)
**Cause:** Mongoose populate not working
**Solution:** 
1. Check if Schedule model has correct ref: `ref: "User"`
2. Check if member ObjectId is valid in database
3. Verify User model exists

### Issue 3: Members show as "Unknown"
**Cause:** Member data structure mismatch
**Solution:** Check console logs to see actual structure, update ScheduleCell logic

### Issue 4: No schedules returned
**Cause:** 
- No schedules created for that week
- Year/week calculation mismatch
**Solution:**
1. Create schedules for the current week
2. Verify year and week numbers match

## Database Verification

### Check Schedule Collection

```javascript
// In MongoDB shell or Compass
db.schedules.find({
  year: 2025,
  weekNumber: 50
}).pretty()
```

### Check Populated Members

```javascript
db.schedules.aggregate([
  {
    $match: { year: 2025, weekNumber: 50 }
  },
  {
    $lookup: {
      from: "users",
      localField: "assignedMembers.member",
      foreignField: "_id",
      as: "memberDetails"
    }
  }
])
```

## API Endpoint Reference

### Get Schedules by Week
- **Endpoint:** `GET /api/schedule/week/:year/:week`
- **Auth Required:** Yes (Admin)
- **Parameters:**
  - `year` (path): Year (e.g., 2025)
  - `week` (path): Week number (1-52)

### Create Schedule
- **Endpoint:** `POST /api/schedule`
- **Auth Required:** Yes (Admin)
- **Body:**
```json
{
  "date": "2025-12-14",
  "shiftTemplateId": "...",
  "memberIds": ["...", "..."],
  "notes": "Optional notes",
  "year": 2025,
  "weekNumber": 50
}
```

### Assign Member to Shift
- **Endpoint:** `PATCH /api/schedule/:id/assign`
- **Auth Required:** Yes (Admin)
- **Body:**
```json
{
  "memberId": "689dfd65898b447034ceaa16"
}
```

## Status Color Coding

The updated ScheduleCell now shows member status with colors:
- **scheduled** - Gray (#ababab)
- **confirmed** - Green
- **completed** - Blue
- **absent** - Red
- **cancelled** - Gray (darker)

## Next Steps

1. **Restart Backend Server**
   ```bash
   cd pos-backend
   npm run dev
   ```

2. **Refresh Frontend**
   ```bash
   # No need to restart, just refresh browser
   ```

3. **Test the Calendar**
   - Navigate to Weekly Schedule page
   - Check browser console for debug logs
   - Check backend terminal for API logs
   - Verify members appear in schedule cells

4. **Create Test Data (if needed)**
   - Create shift templates
   - Create schedules for current week
   - Assign members to schedules

## Files Modified

### Backend
- `pos-backend/controllers/scheduleController.js` - Added debug logging

### Frontend
- `pos-frontend/src/components/schedule/ScheduleCell.jsx` - Enhanced member display logic

## Expected Result

After these changes:
1. ✅ Backend logs show populated member data
2. ✅ Frontend receives complete member objects
3. ✅ Calendar cells display member names correctly
4. ✅ Member status shown with color coding
5. ✅ Console shows detailed debug information

## If Still Not Working

1. **Clear browser cache and reload**
2. **Check Network tab** in browser DevTools to see actual API response
3. **Verify JWT token** is valid and not expired
4. **Check user role** - must be Admin to access schedules
5. **Verify MongoDB connection** is active
6. **Check for any error messages** in backend logs

## Contact
If issues persist, provide:
- Backend console output
- Frontend console output
- Network tab API response
- Browser used
- Screenshot of the calendar

