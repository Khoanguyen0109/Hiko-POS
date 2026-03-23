# Member Active Status Feature

## Overview
This document describes the implementation of the **Active Member** feature, which allows administrators to activate or deactivate member accounts in the Restaurant POS System.

## Features Implemented

### 1. Backend Changes

#### User Model (`pos-backend/models/userModel.js`)
- Added `isActive` field (Boolean, default: `true`)
- This field determines whether a member account is active or inactive

#### Member Controller (`pos-backend/controllers/memberController.js`)
- Added `toggleMemberActiveStatus` function
- Toggles the `isActive` status of a member
- Prevents toggling admin accounts
- Returns updated member data

#### Member Route (`pos-backend/routes/memberRoute.js`)
- Added new endpoint: `PATCH /api/member/:id/toggle-active`
- Protected with `isVerifiedUser` and `isAdmin` middleware
- Only admins can toggle member status

### 2. Frontend Changes

#### API Integration (`pos-frontend/src/https/index.js`)
- Added `toggleMemberActiveStatus(id)` function
- Calls `PATCH /api/member/:id/toggle-active` endpoint

#### Redux Slice (`pos-frontend/src/redux/slices/memberSlice.js`)
- Added `toggleActiveStatus` async thunk
- Added `toggleLoading` state to track toggle operation
- Optimistic UI updates on successful toggle
- Error handling with rejection

#### Members Page UI (`pos-frontend/src/pages/Members.jsx`)
Enhanced with the following features:

1. **Status Filter Dropdown**
   - Filter options: All Members, Active Only, Inactive Only
   - Located in the search/filter bar

2. **Active Status Badge**
   - Green badge for active members
   - Red badge for inactive members
   - Displayed in the member card header

3. **Toggle Button**
   - Green toggle icon for active members
   - Gray toggle icon for inactive members
   - Click to toggle status with API integration
   - Shows loading state during operation

4. **Visual Indicators**
   - Active members: yellow avatar background, full opacity
   - Inactive members: gray avatar background, reduced opacity (75%)
   - Border color changes based on status

## API Endpoints

### Toggle Member Active Status
```
PATCH /api/member/:id/toggle-active
```

**Authorization:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Member activated successfully!",
  "data": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "phone": "...",
    "role": "...",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Usage

### For Administrators

1. **View Active Status**
   - Navigate to Members page
   - Each member card shows an Active/Inactive badge
   - Active members have yellow avatars
   - Inactive members have gray avatars with reduced opacity

2. **Filter Members**
   - Use the status filter dropdown
   - Select "All Members", "Active Only", or "Inactive Only"

3. **Toggle Member Status**
   - Click the toggle icon (🔄) on any member card
   - Active members show a green toggle icon
   - Inactive members show a gray toggle icon
   - Confirmation message appears on success

4. **Search with Status**
   - Use the search bar with status filter
   - Filter by active/inactive status combined with search

## Technical Details

### State Management
- Redux Toolkit for state management
- Async thunks for API calls
- Loading states for better UX
- Error handling with notifications

### UI/UX Features
- Real-time status updates
- Visual feedback during operations
- Color-coded badges and icons
- Responsive design
- Loading indicators

### Security
- Admin-only access to toggle functionality
- Backend validation prevents toggling admin accounts
- JWT authentication required
- Role-based authorization

## Login Validation

### Inactive Member Login Prevention
The system now prevents inactive members from logging in or accessing the system:

1. **Login Endpoint Validation** (`userController.js`)
   - Checks `isActive` status during login
   - Returns 403 error: "Your account has been deactivated. Please contact administrator."
   - Validation occurs after password verification, before token generation

2. **Token Verification Middleware** (`tokenVerification.js`)
   - Checks `isActive` status on every authenticated request
   - Automatically logs out inactive users
   - Prevents inactive members from accessing any protected routes

3. **Get User Data Endpoint** (`userController.js`)
   - Additional validation when fetching user data
   - Ensures inactive users cannot retrieve their profile

### Error Response
When an inactive member tries to login:
```json
{
  "success": false,
  "status": 403,
  "message": "Your account has been deactivated. Please contact administrator."
}
```

## Default Behavior
- New members are created as **active** by default
- `isActive` defaults to `true` if not specified
- Existing members without `isActive` field are treated as active
- **Admin accounts cannot be deactivated** (protected in controller)

## Future Enhancements (Optional)
- Bulk activate/deactivate operations
- Activity log for status changes
- Automatic deactivation based on rules
- Email notifications on status change
- Status change history tracking

## Testing Checklist

### Backend
- ✅ Model includes `isActive` field
- ✅ Controller toggles status correctly
- ✅ Route is protected with admin middleware
- ✅ Admin accounts cannot be toggled
- ✅ Login validation blocks inactive members
- ✅ Token verification checks active status
- ✅ getUserData validates active status

### Frontend
- ✅ Redux slice handles toggle action
- ✅ API integration works correctly
- ✅ UI shows active/inactive status
- ✅ Filter works for all/active/inactive
- ✅ Toggle button updates status
- ✅ Loading states display properly
- ✅ Error handling shows notifications

## Files Modified

### Backend
1. `pos-backend/models/userModel.js` - Added isActive field
2. `pos-backend/controllers/memberController.js` - Toggle functionality
3. `pos-backend/routes/memberRoute.js` - Toggle endpoint
4. `pos-backend/controllers/userController.js` - Login validation
5. `pos-backend/middlewares/tokenVerification.js` - Token validation

### Frontend
1. `pos-frontend/src/https/index.js`
2. `pos-frontend/src/redux/slices/memberSlice.js`
3. `pos-frontend/src/pages/Members.jsx`

## Dependencies
No new dependencies were added. The feature uses existing:
- React Icons (MdToggleOn, MdToggleOff)
- Redux Toolkit
- Notistack for notifications
- Existing axios wrapper

## Conclusion
The Active Member feature has been successfully implemented with full backend-frontend integration, following the existing Redux patterns and coding conventions of the project.

