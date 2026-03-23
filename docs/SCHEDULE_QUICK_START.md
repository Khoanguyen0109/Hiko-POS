# 🚀 Schedule Management - Quick Start Guide

## ✅ Integration Status: COMPLETE

Everything is ready to use! Here's how to get started quickly.

---

## 🎯 What You Can Do Now

### 1. Manage Shift Templates
- Create shifts (Morning, Afternoon, Evening)
- Set start/end times
- Assign colors for visual identification
- Toggle active/inactive status
- Edit and delete templates

### 2. Create Weekly Schedules
- View schedules by week
- Assign multiple members to shifts
- Bulk create schedules for entire week
- Track member attendance

### 3. View Your Integration
- All APIs connected ✅
- Redux slices working ✅
- UI components styled ✅
- Navigation integrated ✅

---

## 🚀 Start Using It (3 Steps)

### Step 1: Start Backend
```bash
cd pos-backend
npm run dev
```
**Expected:** Server running on `http://localhost:3000` ✅

### Step 2: Seed Sample Data (Optional but Recommended)
```bash
# In pos-backend directory
node seeds/shiftTemplateSeeds.js
```
**Creates:**
- ✅ Morning Shift (07:00 - 12:30)
- ✅ Afternoon Shift (12:30 - 17:30)
- ✅ Evening Shift (17:30 - 22:30)

### Step 3: Start Frontend
```bash
# New terminal
cd pos-frontend
npm run dev
```
**Expected:** App running on `http://localhost:5173` ✅

---

## 🖱️ Using the UI (Step-by-Step)

### Access Schedule Management:

1. **Login as Admin**
   - Go to `http://localhost:5173`
   - Click "Login"
   - Use admin credentials

2. **Navigate to Schedules**
   - Click the **"Schedules"** tab in bottom navigation
   - Icon: 📅 Calendar

3. **Manage Shift Templates**
   - Click **"Manage Templates"** button (top right)
   - You'll see a grid of shift templates

### Create Your First Shift Template:

1. Click **"+ Add Template"** button
2. Fill in the form:
   ```
   Name: Morning Shift
   Short Name: MORNING
   Start Time: 07:00
   End Time: 12:30
   Color: Pick any color
   Description: (optional)
   ```
3. Click **"Create"**
4. ✅ Success! Template appears in grid

### Edit a Template:

1. Find template card
2. Click **Edit** icon (pencil)
3. Modify fields
4. Click **"Update"**
5. ✅ Changes saved!

### Toggle Template Status:

1. Find template card
2. Click **Toggle** icon
3. ✅ Status changes (Active ↔ Inactive)

### Delete a Template:

1. Find template card
2. Click **Delete** icon (trash)
3. Confirm deletion
4. ✅ Template removed!

---

## 📊 View Weekly Schedule

### Navigate Weeks:

1. Go to main Schedules page
2. Use **← Previous** / **Next →** buttons
3. See current week highlighted
4. View schedules in calendar grid

### Create Schedule for a Shift:

1. Click on a day/shift cell
2. Select members to assign
3. Add notes (optional)
4. Click **"Create Schedule"**
5. ✅ Members assigned to shift!

---

## 🔧 API Endpoints (For Testing)

### Shift Templates:

```http
# Get all templates
GET http://localhost:3000/api/shift-template
Authorization: Bearer YOUR_TOKEN

# Create template
POST http://localhost:3000/api/shift-template
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Morning Shift",
  "shortName": "MORNING",
  "startTime": "07:00",
  "endTime": "12:30",
  "color": "#FF6B6B",
  "description": "Morning operations"
}

# Update template
PUT http://localhost:3000/api/shift-template/:id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "endTime": "13:00"
}

# Toggle status
PATCH http://localhost:3000/api/shift-template/:id/toggle-active
Authorization: Bearer YOUR_TOKEN

# Delete template
DELETE http://localhost:3000/api/shift-template/:id
Authorization: Bearer YOUR_TOKEN
```

### Schedules:

```http
# Get weekly schedules
GET http://localhost:3000/api/schedule/week/2024/50
Authorization: Bearer YOUR_TOKEN

# Create schedule
POST http://localhost:3000/api/schedule
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "date": "2024-12-16",
  "shiftTemplateId": "TEMPLATE_ID",
  "memberIds": ["MEMBER_ID_1", "MEMBER_ID_2"],
  "notes": "Regular Monday schedule"
}

# Assign member to shift
PATCH http://localhost:3000/api/schedule/:scheduleId/assign
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "memberId": "MEMBER_ID"
}
```

---

## 📱 Features Overview

### ✅ Shift Template Management
- Create, edit, delete shift templates
- Define time ranges
- Color coding for visual identification
- Toggle active/inactive status
- Auto-calculate duration

### ✅ Weekly Schedule View
- Calendar-based interface
- Week navigation (previous/next)
- ISO week numbers
- Vietnam timezone support
- Current week highlighting

### ✅ Member Assignment
- Assign multiple members per shift
- View member schedules
- Track attendance
- Member status updates

### ✅ Schedule Operations
- Create individual schedules
- Bulk create for entire week
- Edit schedule details
- Delete schedules
- Add notes per schedule

---

## 🎨 UI Features

### Visual Design:
- ✅ Dark theme (matches existing design)
- ✅ Responsive layout (mobile + desktop)
- ✅ Color-coded shift templates
- ✅ Icon-based actions
- ✅ Smooth animations
- ✅ Loading states
- ✅ Error notifications
- ✅ Success feedback

### Navigation:
- ✅ Bottom navigation tab
- ✅ Back buttons
- ✅ Week navigation controls
- ✅ Modal dialogs
- ✅ Confirmation prompts

---

## 🔐 Access Control

### Admin Only:
- All schedule management features require **Admin** role
- Non-admin users can view their own schedules (future feature)

### Token Authentication:
- All requests require valid JWT token
- Token stored in localStorage
- Auto-logout on 401 errors

---

## 📦 What's Included

### Backend Files:
```
pos-backend/
├── models/
│   ├── shiftTemplateModel.js    ✅
│   └── scheduleModel.js          ✅
├── controllers/
│   ├── shiftTemplateController.js ✅
│   └── scheduleController.js     ✅
├── routes/
│   ├── shiftTemplateRoute.js     ✅
│   └── scheduleRoute.js          ✅
└── seeds/
    └── shiftTemplateSeeds.js     ✅
```

### Frontend Files:
```
pos-frontend/src/
├── https/
│   └── scheduleApi.js            ✅
├── redux/slices/
│   ├── shiftTemplateSlice.js     ✅
│   └── scheduleSlice.js          ✅
├── components/schedule/
│   ├── ShiftTemplateModal.jsx    ✅
│   └── WeekNavigator.jsx         ✅
├── pages/
│   ├── ShiftTemplates.jsx        ✅
│   └── WeeklySchedule.jsx        ✅
└── utils/
    └── dateUtils.js              ✅ (enhanced)
```

### Documentation:
```
Root/
├── SCHEDULE_INTEGRATION_COMPLETE.md       ✅
├── SCHEDULE_API_INTEGRATION_TEST.md       ✅
├── INTEGRATION_VERIFICATION_REPORT.md     ✅
└── SCHEDULE_QUICK_START.md (this file)   ✅
```

---

## 🐛 Troubleshooting

### Issue: Can't see Schedules tab
**Solution:** Make sure you're logged in as Admin

### Issue: API calls failing
**Solution:** 
1. Check backend is running on port 3000
2. Check `.env` has `VITE_BACKEND_URL=http://localhost:3000`
3. Verify you're logged in (token in localStorage)

### Issue: Week navigation not working
**Solution:** This is normal if you haven't created schedules yet. Create your first shift template and schedule!

### Issue: Time validation error
**Solution:** End time must be after start time. For overnight shifts (cross-midnight), create two separate shifts.

---

## 💡 Pro Tips

### 1. Seed Default Templates First
```bash
node seeds/shiftTemplateSeeds.js
```
This creates standard restaurant shifts automatically!

### 2. Use Color Coding
Assign distinct colors to each shift type for easy visual identification:
- 🔴 Morning Shift - Red (#FF6B6B)
- 🟢 Afternoon Shift - Teal (#4ECDC4)
- 🔵 Evening Shift - Green (#95E1D3)

### 3. Bulk Create Schedules
Instead of creating one day at a time, use bulk creation to set up the entire week!

### 4. Clone Common Patterns
Create schedule templates for typical weeks, then duplicate and adjust as needed.

---

## 📚 Next Steps

### Suggested Workflow:

1. **Week 1: Setup**
   - Create shift templates
   - Test with sample data
   - Familiarize team with UI

2. **Week 2: Go Live**
   - Create real schedules
   - Assign actual members
   - Monitor usage

3. **Week 3+: Optimize**
   - Adjust shift times based on needs
   - Create additional templates
   - Export reports (future feature)

---

## ✅ Verification Checklist

Before production use:

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Admin account created
- [ ] Shift templates created (3+)
- [ ] Members exist in system
- [ ] Test schedule created
- [ ] Test member assignment
- [ ] Verify notifications work
- [ ] Test on mobile/tablet
- [ ] Check responsive design

---

## 🎉 You're All Set!

Everything is integrated and ready to use. Start by:

1. Running the seed script
2. Logging in as Admin
3. Clicking the Schedules tab
4. Creating your first shift template

**Need help?** Check the detailed documentation:
- `SCHEDULE_INTEGRATION_COMPLETE.md` - Full integration details
- `SCHEDULE_API_INTEGRATION_TEST.md` - API testing guide
- `INTEGRATION_VERIFICATION_REPORT.md` - Complete verification

**Happy Scheduling! 🎊**

