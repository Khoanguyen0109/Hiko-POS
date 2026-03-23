# Schedule Permissions - Admin Only Access

## Overview

The Weekly Schedule feature now implements role-based access control (RBAC) to ensure only administrators can modify schedules while allowing all users to view them.

## Permission Model

### 👀 View Access (All Users)
- ✅ View weekly schedule
- ✅ See assigned members
- ✅ Navigate between weeks
- ✅ View shift templates
- ✅ See summary statistics

### ✏️ Edit Access (Admin Only)
- ✅ Assign members to shifts
- ✅ Create new schedules
- ✅ Manage shift templates
- ✅ Remove member assignments
- ✅ Update member status

## Implementation Details

### Frontend Changes

#### 1. WeeklySchedule Component (`pos-frontend/src/pages/WeeklySchedule.jsx`)

**Data Fetching:**
```javascript
// Everyone can view schedules and templates
dispatch(fetchActiveShiftTemplates());
dispatch(fetchSchedulesByWeek(currentWeek));

// Only admins need members list (for assignment)
if (isAdmin) {
  dispatch(fetchMembers());
}
```

**Cell Click Handler:**
```javascript
const handleCellClick = async (date, shiftTemplate) => {
  // Permission check - Admin only
  if (!isAdmin) {
    enqueueSnackbar("Only administrators can assign members to shifts", { 
      variant: "warning" 
    });
    return;
  }
  
  // ... rest of logic
};
```

**UI Elements:**
```javascript
// Manage Templates button - Admin only
{isAdmin && (
  <Link to={ROUTES.SHIFT_TEMPLATES}>
    <MdSettings /> Manage Templates
  </Link>
)}

// Schedule cells - Disabled for non-admins
<ScheduleCell
  schedule={schedule}
  shiftTemplate={template}
  onClick={() => handleCellClick(date, template)}
  disabled={!isAdmin}  // New prop
/>
```

#### 2. ScheduleCell Component (`pos-frontend/src/components/schedule/ScheduleCell.jsx`)

**Disabled State:**
```javascript
const ScheduleCell = ({ ..., disabled = false }) => {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
      title={disabled ? "Only administrators can assign members" : "Click to assign members"}
    >
      {/* ... */}
    </button>
  );
};
```

### Backend Protection

The backend API endpoints are already protected with admin middleware:

```javascript
// scheduleRoute.js
router.route("/")
  .get(isVerifiedUser, isAdmin, getAllSchedules)
  .post(isVerifiedUser, isAdmin, createSchedule);

router.route("/:id/assign")
  .patch(isVerifiedUser, isAdmin, assignMemberToShift);
```

## User Experience

### For Administrators

**Full Access:**
1. View schedule ✅
2. Click any cell to assign members ✅
3. See "Manage Templates" button ✅
4. Create/edit/delete schedules ✅
5. Manage member assignments ✅

**Visual Indicators:**
- All cells are clickable
- Hover effects on cells
- Full opacity
- "Click to assign members" tooltip

### For Non-Admin Users (Staff, Manager, User)

**View-Only Access:**
1. View schedule ✅
2. See assigned members ✅
3. Navigate between weeks ✅
4. View summary statistics ✅
5. NO editing capabilities ❌

**Visual Indicators:**
- Cells appear faded (70% opacity)
- No hover effects
- "cursor-not-allowed" cursor
- "Only administrators can assign members" tooltip
- No "Manage Templates" button

## Permission Checks

### Client-Side (UX)

```javascript
// Check 1: Hide "Manage Templates" button
{isAdmin && <Link to={ROUTES.SHIFT_TEMPLATES}>...</Link>}

// Check 2: Disable cell clicks
const handleCellClick = (date, template) => {
  if (!isAdmin) {
    enqueueSnackbar("Only administrators can assign members", { 
      variant: "warning" 
    });
    return;
  }
  // ... proceed
};

// Check 3: Visual disabled state
<ScheduleCell disabled={!isAdmin} />
```

### Server-Side (Security)

```javascript
// All modification endpoints require admin role
router.route("/schedule")
  .post(isVerifiedUser, isAdmin, createSchedule);

router.route("/schedule/:id/assign")
  .patch(isVerifiedUser, isAdmin, assignMemberToShift);
```

## Role Hierarchy

| Role | View Schedule | Assign Members | Manage Templates |
|------|---------------|----------------|------------------|
| **Admin** | ✅ | ✅ | ✅ |
| **Manager** | ✅ | ❌ | ❌ |
| **Staff** | ✅ | ❌ | ❌ |
| **User** | ✅ | ❌ | ❌ |

## Error Messages

### Permission Denied Messages

```javascript
// When non-admin clicks schedule cell
"Only administrators can assign members to shifts"

// When non-admin accesses assignment modal
"Only administrators can modify schedules"

// When non-admin tries to access templates
"Access denied! Admins only."
```

### HTTP Status Codes

```
200 - Success (authorized)
401 - Unauthorized (not logged in)
403 - Forbidden (not admin)
```

## Testing

### Test as Admin

1. ✅ Login as admin
2. ✅ Navigate to Weekly Schedule
3. ✅ Verify "Manage Templates" button is visible
4. ✅ Click any schedule cell
5. ✅ Verify modal opens
6. ✅ Assign/unassign members
7. ✅ Verify changes save

### Test as Non-Admin

1. ✅ Login as Staff/Manager/User
2. ✅ Navigate to Weekly Schedule
3. ✅ Verify "Manage Templates" button is HIDDEN
4. ✅ Verify cells are faded (70% opacity)
5. ✅ Click any schedule cell
6. ✅ Verify warning notification appears
7. ✅ Verify modal does NOT open
8. ✅ Verify cursor changes to "not-allowed"

## Code Examples

### Checking User Role

```javascript
// Get user role from Redux
const { role } = useSelector((state) => state.user);
const isAdmin = role === "Admin";

// Conditional rendering
{isAdmin ? <AdminButton /> : <ViewOnlyMessage />}

// Conditional behavior
const handleAction = () => {
  if (!isAdmin) {
    showError("Admin only");
    return;
  }
  performAction();
};
```

### Visual Feedback

```css
/* Admin view */
.schedule-cell {
  cursor: pointer;
  opacity: 1;
  hover: border-color: #4ECDC4;
}

/* Non-admin view */
.schedule-cell-disabled {
  cursor: not-allowed;
  opacity: 0.7;
  pointer-events: none; /* or handle in onClick */
}
```

## Security Best Practices

### ✅ Implemented

1. **Client-side checks** - Better UX, prevents accidental clicks
2. **Server-side validation** - Real security, prevents API abuse
3. **Role-based middleware** - Centralized authorization
4. **Clear error messages** - Users know why action failed
5. **Visual indicators** - Disabled state is obvious

### ⚠️ Important Notes

- Client-side checks are for UX only
- Never trust client-side permissions
- Always validate on server
- Use middleware for consistency
- Log permission violations

## Future Enhancements

Possible improvements:

- [ ] Manager role with limited edit access
- [ ] Permission to assign only to own shifts
- [ ] View-only mode toggle for admins
- [ ] Audit log for schedule changes
- [ ] Email notifications for assignments
- [ ] Bulk assignment permissions
- [ ] Department-based permissions

## Troubleshooting

### Issue: Non-admin can still click cells

**Cause:** Disabled prop not passed to ScheduleCell

**Fix:**
```javascript
<ScheduleCell
  disabled={!isAdmin}  // Add this
  {...otherProps}
/>
```

### Issue: Admin sees "permission denied"

**Cause:** Role check failing

**Debug:**
```javascript
console.log('User role:', role);
console.log('Is admin:', isAdmin);
console.log('Expected: "Admin"');
```

### Issue: Modal still opens for non-admin

**Cause:** onClick not checking permissions

**Fix:**
```javascript
const handleCellClick = () => {
  if (!isAdmin) {
    // Stop here!
    enqueueSnackbar("Admin only", { variant: "warning" });
    return;
  }
  // Continue...
};
```

## API Endpoints & Permissions

| Endpoint | Method | Permission | Purpose |
|----------|--------|------------|---------|
| `/api/schedule/week/:year/:week` | GET | Admin | View schedules |
| `/api/schedule` | POST | Admin | Create schedule |
| `/api/schedule/:id/assign` | PATCH | Admin | Assign member |
| `/api/schedule/:id/unassign` | PATCH | Admin | Remove member |
| `/api/schedule/:id/status` | PATCH | Admin | Update status |
| `/api/schedule/:id` | DELETE | Admin | Delete schedule |
| `/api/shift-template` | GET | Admin | View templates |
| `/api/shift-template` | POST | Admin | Create template |

## Summary

### Changes Made

1. ✅ Removed page-level access denial (all can view)
2. ✅ Added permission check in `handleCellClick`
3. ✅ Conditionally show "Manage Templates" button
4. ✅ Added `disabled` prop to ScheduleCell
5. ✅ Visual feedback for disabled state
6. ✅ Helpful tooltip messages
7. ✅ Warning notifications for non-admins

### Result

- **Admins:** Full control over schedules
- **Non-Admins:** View-only access
- **Security:** Server-side validation
- **UX:** Clear visual feedback

---

**Status:** ✅ Permission System Implemented

**Last Updated:** December 14, 2025

**Applies To:** Weekly Schedule & Shift Templates

