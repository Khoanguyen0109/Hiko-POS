# 📚 Schedule Redux Slice - Export Reference

## Correct Import Names

### From `redux/slices/scheduleSlice.js`:

```javascript
import {
  // Fetch Operations
  fetchSchedulesByWeek,           // ✅ Get schedules for a specific week
  fetchSchedulesByDateRange,      // ✅ Get schedules for a date range
  
  // CRUD Operations
  createNewSchedule,              // ✅ Create single schedule
  bulkCreateNewSchedules,         // ✅ Create multiple schedules
  updateExistingSchedule,         // ✅ Update schedule details
  removeSchedule,                 // ✅ Delete schedule
  
  // Member Assignment Operations
  assignMember,                   // ✅ Assign member to schedule
  unassignMember,                 // ✅ Unassign member from schedule
  updateScheduleMemberStatus,     // ✅ Update member status in schedule
  
  // Utility Actions
  clearError,                     // ✅ Clear error state
  setCurrentWeek                  // ✅ Set current week
} from "../redux/slices/scheduleSlice";
```

---

## Common Mistakes

### ❌ WRONG:
```javascript
import { fetchWeeklySchedules } from "../redux/slices/scheduleSlice";
```

### ✅ CORRECT:
```javascript
import { fetchSchedulesByWeek } from "../redux/slices/scheduleSlice";
```

---

## Usage Examples

### 1. Fetch Weekly Schedules
```javascript
// In component
const dispatch = useDispatch();

useEffect(() => {
  dispatch(fetchSchedulesByWeek({ year: 2024, week: 50 }));
}, [dispatch]);
```

### 2. Create New Schedule
```javascript
const handleCreateSchedule = async () => {
  try {
    const result = await dispatch(createNewSchedule({
      date: "2024-12-16",
      shiftTemplateId: "template_id",
      memberIds: []
    })).unwrap();
    
    console.log("Created:", result);
  } catch (error) {
    console.error("Failed:", error);
  }
};
```

### 3. Assign Member
```javascript
const handleAssignMember = async (scheduleId, memberId) => {
  try {
    await dispatch(assignMember({ scheduleId, memberId })).unwrap();
    enqueueSnackbar("Member assigned successfully", { variant: "success" });
  } catch (error) {
    enqueueSnackbar(error, { variant: "error" });
  }
};
```

### 4. Unassign Member
```javascript
const handleUnassignMember = async (scheduleId, memberId) => {
  try {
    await dispatch(unassignMember({ scheduleId, memberId })).unwrap();
    enqueueSnackbar("Member unassigned successfully", { variant: "success" });
  } catch (error) {
    enqueueSnackbar(error, { variant: "error" });
  }
};
```

---

## State Structure

```javascript
{
  schedules: {
    schedules: [],              // Array of schedule objects
    currentWeek: null,          // Current week number
    currentYear: null,          // Current year
    loading: false,             // General loading state
    error: null,                // Error message
    createLoading: false,       // Create operation loading
    updateLoading: false,       // Update operation loading
    deleteLoading: false,       // Delete operation loading
    assignLoading: false        // Assign/unassign operation loading
  }
}
```

---

## Selector Examples

```javascript
// In component
const { schedules, loading, error, assignLoading } = useSelector(
  (state) => state.schedules
);

// Or individual selectors
const schedules = useSelector((state) => state.schedules.schedules);
const loading = useSelector((state) => state.schedules.loading);
const error = useSelector((state) => state.schedules.error);
```

---

## Complete Import Example

```javascript
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import {
  fetchSchedulesByWeek,
  createNewSchedule,
  assignMember,
  unassignMember,
  clearError
} from "../redux/slices/scheduleSlice";

const MyComponent = () => {
  const dispatch = useDispatch();
  const { schedules, loading, error } = useSelector((state) => state.schedules);
  
  useEffect(() => {
    dispatch(fetchSchedulesByWeek({ year: 2024, week: 50 }));
  }, [dispatch]);
  
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);
  
  // Component logic...
};
```

---

## All Available Async Thunks

| Export Name | Purpose | Parameters |
|-------------|---------|------------|
| `fetchSchedulesByWeek` | Get schedules for a week | `{ year, week }` |
| `fetchSchedulesByDateRange` | Get schedules for date range | `{ startDate, endDate }` |
| `createNewSchedule` | Create single schedule | `{ date, shiftTemplateId, memberIds?, notes? }` |
| `bulkCreateNewSchedules` | Create multiple schedules | `[{ date, shiftTemplateId, ... }]` |
| `updateExistingSchedule` | Update schedule | `{ id, data }` |
| `removeSchedule` | Delete schedule | `id` |
| `assignMember` | Assign member to schedule | `{ scheduleId, memberId }` |
| `unassignMember` | Unassign member | `{ scheduleId, memberId }` |
| `updateScheduleMemberStatus` | Update member status | `{ scheduleId, memberId, status }` |

---

## API Parameters Reference

### fetchSchedulesByWeek
```javascript
dispatch(fetchSchedulesByWeek({ 
  year: 2024,    // Number: Year
  week: 50       // Number: ISO week number
}));
```

### createNewSchedule
```javascript
dispatch(createNewSchedule({
  date: "2024-12-16",           // String: YYYY-MM-DD
  shiftTemplateId: "abc123",    // String: Template ID
  memberIds: ["id1", "id2"],    // Array: Optional, member IDs
  notes: "Special instructions"  // String: Optional
}));
```

### assignMember
```javascript
dispatch(assignMember({
  scheduleId: "schedule123",    // String: Schedule ID
  memberId: "member456"         // String: Member ID
}));
```

### unassignMember
```javascript
dispatch(unassignMember({
  scheduleId: "schedule123",    // String: Schedule ID
  memberId: "member456"         // String: Member ID
}));
```

---

## Error Handling Pattern

```javascript
try {
  const result = await dispatch(asyncThunk(params)).unwrap();
  // Success
  enqueueSnackbar("Success message", { variant: "success" });
  return result;
} catch (error) {
  // Error is already a string message from rejectWithValue
  enqueueSnackbar(error, { variant: "error" });
  throw error;
}
```

---

## Loading State Usage

```javascript
const { loading, createLoading, assignLoading } = useSelector(
  (state) => state.schedules
);

return (
  <div>
    {/* General loading (for fetches) */}
    {loading && <Spinner />}
    
    {/* Specific operation loading */}
    <button disabled={createLoading}>
      {createLoading ? "Creating..." : "Create Schedule"}
    </button>
    
    <button disabled={assignLoading}>
      {assignLoading ? "Assigning..." : "Assign Member"}
    </button>
  </div>
);
```

---

## Quick Reference Card

### Fetch Data:
- `fetchSchedulesByWeek({ year, week })`
- `fetchSchedulesByDateRange({ startDate, endDate })`

### Manage Schedules:
- `createNewSchedule(data)`
- `bulkCreateNewSchedules(schedules)`
- `updateExistingSchedule({ id, data })`
- `removeSchedule(id)`

### Manage Members:
- `assignMember({ scheduleId, memberId })`
- `unassignMember({ scheduleId, memberId })`
- `updateScheduleMemberStatus({ scheduleId, memberId, status })`

### Utilities:
- `clearError()`
- `setCurrentWeek({ year, week })`

---

**Always use these exact export names to avoid import errors!** ✅


