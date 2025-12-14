# Monthly Salary Calculator Feature

## 🎯 Overview

Added a monthly salary calculator in the Account Settings page that calculates a member's earnings based on their assigned shifts for a selected month.

## ✨ Features

### 1. **Monthly Salary Calculation**
- Calculates total earnings based on shifts worked
- Uses hourly rate from member's `salary` field
- Formula: `Total Salary = Total Hours × Hourly Rate`

### 2. **Month and Year Filter**
- Dropdown selectors for month and year
- Shows last 2 years and next 2 years
- Auto-loads data when month/year changes

### 3. **Salary Summary Dashboard**
- **Total Shifts**: Count of shifts worked in the month
- **Total Hours**: Sum of all shift durations
- **Hourly Rate**: Member's configured hourly rate
- **Total Salary**: Calculated monthly earnings

### 4. **Shift Details View**
- Expandable list of all shifts in the month
- Shows: Date, Shift name, Time, Hours, Earned amount
- Color-coded by shift type
- Scrollable if many shifts

### 5. **Security**
- Members can only view their own salary
- Protected by authentication middleware
- Uses logged-in user's token

## 📁 Files Created/Modified

### Backend Files Created:

1. **`pos-backend/controllers/salaryController.js`**
   - `getMonthlySalary`: Fetches member's shifts and calculates salary

2. **`pos-backend/routes/salaryRoute.js`**
   - `GET /api/salary/:year/:month`: Get monthly salary endpoint

### Backend Files Modified:

3. **`pos-backend/app.js`**
   - Added salary route: `app.use("/api/salary", require("./routes/salaryRoute"))`

### Frontend Files Created:

4. **`pos-frontend/src/https/salaryApi.js`**
   - `getMonthlySalary(year, month)`: API call function

### Frontend Files Modified:

5. **`pos-frontend/src/pages/AccountSettings.jsx`**
   - Added salary calculator section
   - Month/year selectors
   - Salary summary cards
   - Shift details list

## 🔧 API Endpoint

### `GET /api/salary/:year/:month`

**Authentication**: Required (Bearer token)

**Parameters:**
- `year`: Year (e.g., 2025)
- `month`: Month number 1-12

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "...",
      "name": "John Doe",
      "role": "User",
      "hourlyRate": 15
    },
    "period": {
      "year": 2025,
      "month": 12,
      "monthName": "December"
    },
    "summary": {
      "totalShifts": 12,
      "totalHours": 60,
      "hourlyRate": 15,
      "totalSalary": 900
    },
    "shifts": [
      {
        "date": "2025-12-08T00:00:00.000Z",
        "shiftName": "Morning",
        "startTime": "06:30",
        "endTime": "11:30",
        "hours": 5,
        "status": "scheduled",
        "color": "#f6b100"
      }
      // ... more shifts
    ]
  }
}
```

## 💰 How Salary is Calculated

### Step 1: Get Hourly Rate
- From `User.salary` field in database
- If not set, defaults to 0

### Step 2: Find All Shifts
- Query schedules where member is assigned
- Filter by year and month
- Include shift template details

### Step 3: Calculate Hours
```javascript
For each schedule:
  - Get shift template duration (e.g., Morning = 5 hours)
  - Add to total hours
```

### Step 4: Calculate Salary
```javascript
Total Salary = Total Hours × Hourly Rate

Example:
- Total Hours: 60 hours
- Hourly Rate: $15/hour
- Total Salary: 60 × $15 = $900
```

## 🎨 UI Components

### 1. Month/Year Selectors
```jsx
<select value={selectedMonth} onChange={...}>
  <option value="1">January</option>
  ...
  <option value="12">December</option>
</select>

<select value={selectedYear} onChange={...}>
  <option value="2023">2023</option>
  <option value="2024">2024</option>
  <option value="2025">2025</option>
  ...
</select>
```

### 2. Summary Cards
- Grid layout (2 columns on mobile, 4 on desktop)
- Color-coded (total salary highlighted in teal)
- Large, bold numbers for easy reading

### 3. Shift Details
- Collapsible section
- Shows:
  - Date with day of week
  - Shift name and color indicator
  - Start/end time
  - Hours worked
  - Amount earned for that shift

## 📊 Example Usage

### Scenario 1: Member with Regular Shifts

**Member:** test1
**Hourly Rate:** $20/hour
**Month:** December 2025

**Shifts Worked:**
- Dec 8: Morning (5h) → $100
- Dec 9: Morning (5h) → $100
- Dec 10: Morning (5h) → $100
- Dec 11: Morning (5h) → $100
- Dec 12: Morning (5h) → $100
- Dec 13: Morning (5h) → $100

**Result:**
- Total Shifts: 6
- Total Hours: 30h
- Total Salary: $600

### Scenario 2: Member with Multiple Shift Types

**Shifts Worked:**
- Dec 8: Morning (5h) + Afternoon (6h) = 11h → $220
- Dec 9: Evening (5h) = 5h → $100

**Result:**
- Total Shifts: 3
- Total Hours: 16h
- Total Salary: $320

## 🔐 Security Features

### 1. Authentication Required
- Must be logged in to access
- Token verified via `isVerifiedUser` middleware

### 2. User-Specific Data
- Automatically uses logged-in member's ID
- Cannot view other members' salary data

### 3. Role-Based Access
- Any logged-in member can view their own salary
- Admin/User roles both supported

## 🎯 Future Enhancements (Optional)

1. **Bonus System**
   - Add bonus field for extra earnings
   - Include in total salary calculation

2. **Deductions**
   - Add deductions field (taxes, etc.)
   - Show net salary after deductions

3. **Salary History**
   - View past months' salaries
   - Compare month-to-month earnings

4. **Export**
   - Download salary report as PDF
   - Export shift details to CSV

5. **Attendance Status**
   - Highlight absent/cancelled shifts
   - Only count completed shifts

## 🧪 Testing

### Test 1: View Current Month Salary
1. Login as a member
2. Go to Account Settings
3. Salary section should show current month by default
4. Verify totals are correct

### Test 2: Change Month
1. Select different month from dropdown
2. Data should reload automatically
3. Verify correct month's data is shown

### Test 3: No Shifts
1. Select a month with no shifts assigned
2. Should show "No shifts assigned" message
3. All totals should be 0

### Test 4: Multiple Shifts
1. Assign member to multiple shifts in December
2. Refresh Account Settings
3. Verify all shifts appear in details
4. Verify total calculation is correct

## 📝 Notes

- **Hourly Rate**: Set in Members page when creating/editing a member
- **Shift Duration**: Auto-calculated from shift template times
- **Date Handling**: Uses local timezone (Vietnam) for display
- **Performance**: Efficient with indexed queries on schedules

## ✅ Summary

The monthly salary calculator provides members with transparency into their earnings based on shifts worked. It's fully integrated into the Account Settings page, automatically secured, and provides a clean, intuitive interface for viewing monthly salary details.

**Key Benefit**: Members can easily track their monthly earnings without admin intervention!

