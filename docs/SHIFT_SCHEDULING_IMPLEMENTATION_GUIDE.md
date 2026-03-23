# Shift Scheduling System - Quick Implementation Guide

## Quick Start Checklist

This guide provides the step-by-step implementation order for the shift scheduling system.

---

## Phase 1: Backend Setup (Priority: HIGH)

### Step 1.1: Create Models

```bash
# Create the following files:
pos-backend/models/shiftTemplateModel.js
pos-backend/models/scheduleModel.js
```

**Files to create:**
1. `shiftTemplateModel.js` - Defines shift types (Morning, Afternoon, Evening)
2. `scheduleModel.js` - Stores shift assignments

### Step 1.2: Create Controllers

```bash
# Create the following files:
pos-backend/controllers/shiftTemplateController.js
pos-backend/controllers/scheduleController.js
```

**Key Functions Needed:**

**ShiftTemplateController:**
- `getAllShiftTemplates()`
- `createShiftTemplate()`
- `updateShiftTemplate()`
- `deleteShiftTemplate()`

**ScheduleController:**
- `getSchedulesByWeek()` ⭐ Most Important
- `getSchedulesByDate()`
- `createSchedule()`
- `bulkCreateSchedules()` ⭐ For weekly scheduling
- `assignMemberToShift()`
- `unassignMemberFromShift()`
- `getMySchedules()` - For members to view their own schedule

### Step 1.3: Create Routes

```bash
# Create the following files:
pos-backend/routes/shiftTemplateRoute.js
pos-backend/routes/scheduleRoute.js
```

**Register routes in `app.js`:**
```javascript
// In pos-backend/app.js
const shiftTemplateRoutes = require("./routes/shiftTemplateRoute");
const scheduleRoutes = require("./routes/scheduleRoute");

app.use("/api/shift-template", shiftTemplateRoutes);
app.use("/api/schedule", scheduleRoutes);
```

### Step 1.4: Seed Initial Data (Optional but Recommended)

Create default shift templates:

```bash
# Create file:
pos-backend/seeds/shiftTemplateSeeds.js
```

```javascript
const ShiftTemplate = require("../models/shiftTemplateModel");

const defaultShiftTemplates = [
    {
        name: "Morning Shift",
        shortName: "MORNING",
        startTime: "07:00",
        endTime: "12:30",
        color: "#FF6B6B",
        description: "Early morning operations"
    },
    {
        name: "Afternoon Shift",
        shortName: "AFTERNOON",
        startTime: "12:30",
        endTime: "17:30",
        color: "#4ECDC4",
        description: "Lunch and afternoon service"
    },
    {
        name: "Evening Shift",
        shortName: "EVENING",
        startTime: "17:30",
        endTime: "22:30",
        color: "#95E1D3",
        description: "Dinner service and closing"
    }
];

const seedShiftTemplates = async () => {
    try {
        await ShiftTemplate.deleteMany({});
        await ShiftTemplate.insertMany(defaultShiftTemplates);
        console.log("✅ Shift templates seeded successfully");
    } catch (error) {
        console.error("❌ Error seeding shift templates:", error);
    }
};

module.exports = { seedShiftTemplates };
```

---

## Phase 2: Frontend Setup

### Step 2.1: Create API Service

```bash
# Create file:
pos-frontend/src/https/scheduleApi.js
```

```javascript
import { axiosWrapper } from "./axiosWrapper";

// Shift Template APIs
export const getAllShiftTemplates = () => 
    axiosWrapper.get("/shift-template");

export const createShiftTemplate = (data) => 
    axiosWrapper.post("/shift-template", data);

export const updateShiftTemplate = (id, data) => 
    axiosWrapper.put(`/shift-template/${id}`, data);

export const deleteShiftTemplate = (id) => 
    axiosWrapper.delete(`/shift-template/${id}`);

// Schedule APIs
export const getSchedulesByWeek = (year, week) => 
    axiosWrapper.get(`/schedule/week/${year}/${week}`);

export const getSchedulesByDate = (date) => 
    axiosWrapper.get(`/schedule/date/${date}`);

export const createSchedule = (data) => 
    axiosWrapper.post("/schedule", data);

export const bulkCreateSchedules = (schedules) => 
    axiosWrapper.post("/schedule/bulk", { schedules });

export const assignMemberToShift = (scheduleId, memberId) => 
    axiosWrapper.patch(`/schedule/${scheduleId}/assign`, { memberId });

export const unassignMemberFromShift = (scheduleId, memberId) => 
    axiosWrapper.patch(`/schedule/${scheduleId}/unassign`, { memberId });

export const getMySchedules = (params) => 
    axiosWrapper.get("/schedule/my-schedule", { params });
```

### Step 2.2: Create Redux Slices

```bash
# Create files:
pos-frontend/src/redux/slices/shiftTemplateSlice.js
pos-frontend/src/redux/slices/scheduleSlice.js
```

**Basic structure for `scheduleSlice.js`:**
```javascript
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as scheduleApi from "../../https/scheduleApi";

export const fetchSchedulesByWeek = createAsyncThunk(
    "schedule/fetchByWeek",
    async ({ year, week }, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.getSchedulesByWeek(year, week);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch schedules");
        }
    }
);

const initialState = {
    schedules: [],
    currentWeek: null,
    currentYear: null,
    loading: false,
    error: null
};

const scheduleSlice = createSlice({
    name: "schedule",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSchedulesByWeek.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSchedulesByWeek.fulfilled, (state, action) => {
                state.loading = false;
                state.schedules = action.payload.data;
                state.error = null;
            })
            .addCase(fetchSchedulesByWeek.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError } = scheduleSlice.actions;
export default scheduleSlice.reducer;
```

**Register in store:**
```javascript
// pos-frontend/src/redux/store.js
import scheduleReducer from './slices/scheduleSlice';
import shiftTemplateReducer from './slices/shiftTemplateSlice';

export const store = configureStore({
    reducer: {
        // ... existing reducers
        schedule: scheduleReducer,
        shiftTemplate: shiftTemplateReducer,
    },
});
```

### Step 2.3: Create Utility Functions

```bash
# Create file:
pos-frontend/src/utils/dateUtils.js
```

```javascript
// Get current week number
export const getWeekNumber = (date = new Date()) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Get dates in a week
export const getWeekDates = (year, weekNumber) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7;
    const weekStart = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + daysOffset));
    
    // Adjust to Monday
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(weekStart.setDate(diff));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(date);
    }
    
    return dates;
};

// Format date for display
export const formatDate = (date, format = "short") => {
    const d = new Date(date);
    
    if (format === "short") {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    if (format === "full") {
        return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    return d.toLocaleDateString();
};

// Get week range string
export const getWeekRangeString = (year, weekNumber) => {
    const dates = getWeekDates(year, weekNumber);
    const start = formatDate(dates[0], "short");
    const end = formatDate(dates[6], "short");
    return `${start} - ${end}`;
};

// Check if date is today
export const isToday = (date) => {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
};

// Check if date is in past
export const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
};
```

---

## Phase 3: Build UI Components

### Step 3.1: Create Shift Templates Page (FIRST)

**Priority: HIGH** - This is the foundation

```bash
# Create file:
pos-frontend/src/pages/ShiftTemplates.jsx
```

**Features to implement:**
- List all shift templates
- Create new shift template
- Edit existing shift template
- Delete shift template
- Toggle active status

### Step 3.2: Create Weekly Schedule Page (SECOND)

**Priority: HIGH** - This is the main feature

```bash
# Create files:
pos-frontend/src/pages/WeeklySchedule.jsx
pos-frontend/src/components/schedule/WeeklyScheduleGrid.jsx
pos-frontend/src/components/schedule/WeekNavigator.jsx
```

**Key Features:**
1. **Week Navigation** - Navigate between weeks
2. **Grid Display** - Show all shifts for each day
3. **Member Assignment** - Assign/unassign members
4. **Visual Indicators** - Show scheduled, confirmed, completed statuses

**Grid Layout:**
- Columns: Days of the week (Mon-Sun)
- Rows: Shift templates (Morning, Afternoon, Evening)
- Cells: Assigned members + "Add" button

### Step 3.3: Create Modals

```bash
# Create files:
pos-frontend/src/components/schedule/ShiftTemplateModal.jsx
pos-frontend/src/components/schedule/ScheduleModal.jsx
pos-frontend/src/components/schedule/MemberAssignmentModal.jsx
```

### Step 3.4: Create Member Schedule View (THIRD)

```bash
# Create file:
pos-frontend/src/pages/MySchedule.jsx
```

**Features:**
- View own upcoming shifts
- Filter by date range
- Clock in/out functionality (future)
- Download schedule

---

## Phase 4: Advanced Features (Later)

### Future Enhancements:

1. **Schedule Templates**
   - Save weekly patterns
   - Quick copy previous week
   - Repeat schedules

2. **Conflict Detection**
   - Check for double bookings
   - Validate shift overlaps
   - Member availability

3. **Notifications**
   - Email reminders
   - Schedule change alerts
   - Upcoming shift notifications

4. **Reports**
   - Hours worked per member
   - Labor cost analysis
   - Attendance tracking

5. **Mobile Optimization**
   - Responsive design
   - Touch-friendly interactions
   - Mobile app support

---

## Testing Checklist

### Backend Tests
- [ ] Create shift template
- [ ] Get all shift templates
- [ ] Update shift template
- [ ] Delete shift template
- [ ] Create schedule
- [ ] Bulk create schedules
- [ ] Assign member to shift
- [ ] Get schedules by week
- [ ] Get schedules by date
- [ ] Get member's schedules

### Frontend Tests
- [ ] Display shift templates
- [ ] Create new shift template
- [ ] Edit shift template
- [ ] Display weekly schedule grid
- [ ] Navigate between weeks
- [ ] Assign member to shift
- [ ] Unassign member from shift
- [ ] View member's own schedule
- [ ] Responsive design works

---

## Recommended Development Order

### Week 1: Backend Foundation
1. Create models (Day 1)
2. Create controllers (Day 2-3)
3. Create routes and test APIs (Day 4)
4. Seed initial data (Day 5)

### Week 2: Basic Frontend
1. Create Redux slices and API services (Day 1)
2. Create Shift Templates page (Day 2-3)
3. Test shift template CRUD (Day 4)
4. Fix bugs and refine (Day 5)

### Week 3: Schedule Management
1. Create WeeklyScheduleGrid component (Day 1-2)
2. Implement week navigation (Day 3)
3. Create schedule creation modal (Day 4)
4. Test schedule creation (Day 5)

### Week 4: Member Assignment
1. Create MemberAssignmentModal (Day 1)
2. Implement assign/unassign functionality (Day 2-3)
3. Add visual indicators and status (Day 4)
4. Test and fix bugs (Day 5)

### Week 5: Member View & Polish
1. Create MySchedule page (Day 1-2)
2. Add filters and search (Day 3)
3. Polish UI/UX (Day 4)
4. Final testing and deployment (Day 5)

---

## Color Scheme Suggestions

```javascript
// Shift colors
const shiftColors = {
    morning: {
        bg: "#FFF4E6",
        border: "#FFB84D",
        text: "#CC8800"
    },
    afternoon: {
        bg: "#E6F7FF",
        border: "#4DA6FF",
        text: "#0066CC"
    },
    evening: {
        bg: "#F0E6FF",
        border: "#9966FF",
        text: "#6600CC"
    }
};

// Status colors
const statusColors = {
    scheduled: "#FFA500",  // Orange
    confirmed: "#4CAF50",  // Green
    completed: "#2196F3",  // Blue
    absent: "#F44336",     // Red
    cancelled: "#9E9E9E"   // Gray
};
```

---

## Common Issues & Solutions

### Issue 1: Week Number Calculation
**Problem:** Different week number calculations across systems
**Solution:** Use ISO 8601 standard, implement in both backend and frontend

### Issue 2: Timezone Issues
**Problem:** Date displays differently based on timezone
**Solution:** Store dates in UTC, convert to local time for display

### Issue 3: Overlapping Shifts
**Problem:** Members assigned to overlapping shifts
**Solution:** Add validation in controller before assignment

### Issue 4: Performance with Large Data
**Problem:** Slow loading when viewing many weeks
**Solution:** Implement pagination, load only current week by default

---

## Quick Commands

```bash
# Backend - Start development server
cd pos-backend && npm run dev

# Frontend - Start development server
cd pos-frontend && npm run dev

# Test backend API endpoints
npm run test

# Seed shift templates
node pos-backend/seeds/shiftTemplateSeeds.js
```

---

## API Testing Examples (Postman/Thunder Client)

### Create Shift Template
```
POST http://localhost:3000/api/shift-template
Headers: Authorization: Bearer <token>
Body:
{
    "name": "Morning Shift",
    "shortName": "MORNING",
    "startTime": "07:00",
    "endTime": "12:30",
    "color": "#FF6B6B",
    "description": "Early morning operations"
}
```

### Create Schedule
```
POST http://localhost:3000/api/schedule
Headers: Authorization: Bearer <token>
Body:
{
    "date": "2024-11-11",
    "shiftTemplateId": "673a1234567890abcdef1234",
    "memberIds": ["673b1234567890abcdef5678", "673c1234567890abcdef9012"],
    "notes": "Holiday schedule"
}
```

### Get Week Schedule
```
GET http://localhost:3000/api/schedule/week/2024/45
Headers: Authorization: Bearer <token>
```

---

Would you like me to start implementing any specific part of this system? I recommend starting with:

1. **Backend Models** - Foundation for everything
2. **Shift Templates** - Easier to implement and test first
3. **Weekly Schedule** - Main feature

Let me know which part you'd like to tackle first!

