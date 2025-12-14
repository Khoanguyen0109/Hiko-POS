# 🧪 Member Assignment Feature - Testing Guide

## Quick Test (5 Minutes)

### Prerequisites:
✅ Backend running on `http://localhost:3000`  
✅ Frontend running on `http://localhost:5173`  
✅ At least 1 shift template created  
✅ At least 2 members created  
✅ Logged in as Admin  

---

## 🎯 Test Scenarios

### Test 1: Basic Assignment (2 minutes)

**Steps:**
```
1. Navigate to Schedules tab
   Expected: Weekly grid displays with shift templates

2. Click on any shift cell (e.g., Monday Morning)
   Expected: 
   - Loading indicator appears briefly
   - Modal opens with "Assign Members to Shift" title
   - Shift details shown in header
   - List of members displayed

3. Click on a member (e.g., "John Doe")
   Expected:
   - Loading overlay appears briefly
   - Success notification: "Member assigned successfully"
   - Member card becomes highlighted (teal background + border)
   - Counter shows: "1 member(s) assigned"

4. Click "Done" button
   Expected:
   - Modal closes
   - Grid cell now shows "John Doe" with person icon
   - Cell background changes from dark to lighter

5. Click same shift cell again
   Expected:
   - Modal opens
   - John Doe is pre-selected (highlighted)
```

**✅ Pass Criteria:**
- Member successfully assigned
- UI updates immediately
- Modal shows correct state on reopen

---

### Test 2: Multiple Assignments (2 minutes)

**Steps:**
```
1. Open any shift cell
2. Assign 4 members one by one
   Expected: Each assignment shows success notification
3. Click "Done"
   Expected: Cell shows first 3 members + "+1 more"
4. Reopen same cell
   Expected: All 4 members are highlighted
```

**✅ Pass Criteria:**
- All members assigned successfully
- "+N more" indicator shows correctly
- Count is accurate

---

### Test 3: Unassign Member (1 minute)

**Steps:**
```
1. Open a shift with assigned members
2. Click on an already-highlighted member
   Expected:
   - Loading overlay
   - Success notification: "Member unassigned successfully"
   - Member card becomes unhighlighted
   - Counter decrements

3. Click "Done"
   Expected: Grid cell no longer shows that member
```

**✅ Pass Criteria:**
- Member removed from schedule
- UI updates correctly
- No errors

---

### Test 4: Search Functionality (1 minute)

**Steps:**
```
1. Open any shift cell (modal opens)
2. Type "john" in search box
   Expected: Only members with "john" in name/email show
3. Clear search box
   Expected: All members reappear
4. Type "example.com"
   Expected: Members with that domain show
```

**✅ Pass Criteria:**
- Search filters by name
- Search filters by email
- Case-insensitive
- Clear search works

---

### Test 5: Week Navigation (1 minute)

**Steps:**
```
1. Assign members to Monday Morning shift
2. Click "Next Week" arrow
   Expected: Grid shows next week's dates
3. Click "Previous Week" arrow twice
   Expected: Back to original week
4. Verify Monday Morning still shows assigned members
```

**✅ Pass Criteria:**
- Week navigation works
- Schedules load for each week
- Data persists correctly

---

### Test 6: Week Summary Stats (30 seconds)

**Steps:**
```
1. Note current "Empty" count
2. Assign members to an empty shift
3. Click "Done"
   Expected:
   - "Assigned" count increases by 1
   - "Empty" count decreases by 1
   - "Total Members" updates if new unique members
```

**✅ Pass Criteria:**
- Statistics update in real-time
- Numbers are accurate

---

## 🐛 Common Issues & Solutions

### Issue 1: "No active members available"

**Cause:** No members in database or all inactive

**Solution:**
```bash
# Go to Members page
# Create at least 2 members
# Ensure "Active" status is checked
```

---

### Issue 2: Modal doesn't open

**Cause:** Missing shift templates

**Solution:**
```bash
# Run seed script
node pos-backend/seeds/shiftTemplateSeeds.js

# Or create templates via UI:
# Schedules → Manage Templates → + Add Template
```

---

### Issue 3: "Failed to create schedule"

**Possible Causes:**
1. Backend not running
2. Not logged in as Admin
3. Invalid date/template

**Solutions:**
```bash
# Check backend
cd pos-backend && npm run dev

# Check login
# Logout and login again as Admin

# Check console for errors
# Open browser DevTools → Console
```

---

### Issue 4: Members not showing after assignment

**Cause:** Frontend not refreshing after modal close

**Solution:**
```bash
# Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
# Clear cache if issue persists
```

---

### Issue 5: API errors (401, 403, 500)

**Solutions:**

**401 Unauthorized:**
- Token expired → Logout and login again

**403 Forbidden:**
- Not admin → Ensure logged in as Admin role

**500 Server Error:**
- Check backend console for error details
- Verify MongoDB is running
- Check backend logs

---

## 📊 API Call Verification

### Using Browser DevTools:

```
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Click a shift cell

Expected API Calls:
1. POST /api/schedule
   Status: 201 Created
   Response: { success: true, data: {...} }

2. Click a member to assign

Expected API Call:
1. PATCH /api/schedule/:id/assign
   Status: 200 OK
   Response: { success: true, message: "Member assigned successfully", data: {...} }

3. Close modal

Expected API Call:
1. GET /api/schedule/week/:year/:week
   Status: 200 OK
   Response: { success: true, count: N, data: [...] }
```

---

## 🔍 Redux State Verification

### Using Redux DevTools:

```
1. Open Redux DevTools in browser
2. Watch state changes

On Page Load:
  shiftTemplate/fetchActive/pending
  shiftTemplate/fetchActive/fulfilled
  member/fetch/pending
  member/fetch/fulfilled
  schedule/fetchWeekly/pending
  schedule/fetchWeekly/fulfilled

On Cell Click (Create):
  schedule/create/pending
  schedule/create/fulfilled

On Member Assignment:
  schedule/assignMember/pending
  schedule/assignMember/fulfilled

State After Assignment:
schedules: {
  schedules: [
    {
      _id: "...",
      members: ["member_id_1", "member_id_2"],
      ...
    }
  ],
  assignLoading: false
}
```

---

## ✅ Complete Test Checklist

### Basic Functionality:
- [ ] Page loads without errors
- [ ] Grid displays correctly
- [ ] Can click shift cells
- [ ] Modal opens and closes
- [ ] Can assign members
- [ ] Can unassign members
- [ ] Success notifications appear
- [ ] Error handling works

### UI/UX:
- [ ] Loading states show correctly
- [ ] Member cards highlight when selected
- [ ] Search filters members
- [ ] Counter updates in real-time
- [ ] Grid cells update after assignment
- [ ] "+N more" indicator shows correctly
- [ ] Week summary stats accurate

### Navigation:
- [ ] Week navigation works
- [ ] Can navigate to different weeks
- [ ] Data persists across navigation
- [ ] Can return to current week

### Edge Cases:
- [ ] Empty database handled gracefully
- [ ] No shift templates shows helpful message
- [ ] No members shows helpful message
- [ ] Network errors handled
- [ ] Can assign same member to multiple shifts
- [ ] Can unassign all members (empty state)

### Responsive:
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Grid scrolls horizontally on small screens
- [ ] Modal adapts to screen size

---

## 🎯 Performance Testing

### Expected Response Times:

| Operation | Expected Time | Acceptable Max |
|-----------|---------------|----------------|
| Load page | < 500ms | 1s |
| Click cell | < 200ms | 500ms |
| Assign member | < 300ms | 700ms |
| Unassign member | < 300ms | 700ms |
| Search filter | < 50ms | 100ms |
| Week navigation | < 400ms | 1s |

### Testing Performance:

```
1. Open DevTools → Network tab
2. Note "DOMContentLoaded" time
3. Perform actions and check timing
4. Look for slow API calls (>1s)
```

---

## 🚨 Critical Bugs to Watch For

### High Priority:

1. **Data Loss**
   - Assigned members disappear after refresh
   - Members assigned to wrong shift
   - Week changes lose assignments

2. **State Inconsistency**
   - Modal shows wrong members selected
   - Grid doesn't update after assignment
   - Counter shows wrong number

3. **API Failures**
   - 401 errors (auth issues)
   - 500 errors (backend crashes)
   - Network timeouts

4. **UI Blocking**
   - Page becomes unresponsive
   - Modal can't be closed
   - Infinite loading states

### Medium Priority:

1. **Visual Bugs**
   - Colors not displaying correctly
   - Text overflow/truncation issues
   - Alignment problems

2. **Search Issues**
   - Search doesn't filter
   - Case sensitivity problems
   - Special characters break search

3. **Navigation Issues**
   - Week navigation off by one
   - Can't return to current week
   - Date display incorrect

---

## 📞 Reporting Issues

### Template:

```
**Issue:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge + version]
- OS: [macOS/Windows/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

**Console Errors:**
[Copy any errors from browser console]

**Screenshots:**
[If applicable]

**Additional Context:**
[Any other relevant information]
```

---

## ✅ Sign-Off Checklist

Before marking as production-ready:

- [ ] All basic functionality tests pass
- [ ] All UI/UX tests pass
- [ ] All edge cases handled
- [ ] Responsive design verified
- [ ] Performance acceptable
- [ ] No critical bugs found
- [ ] Error handling verified
- [ ] API integration verified
- [ ] Redux state correct
- [ ] Code reviewed
- [ ] Documentation complete

---

## 🎉 Success Criteria

### Feature is COMPLETE when:

✅ **Functional:** All tests pass without errors  
✅ **Performant:** Response times within acceptable limits  
✅ **Reliable:** No data loss or state issues  
✅ **Usable:** Intuitive and easy to use  
✅ **Beautiful:** Matches design system  
✅ **Responsive:** Works on all devices  
✅ **Accessible:** Keyboard navigation works  
✅ **Documented:** Complete user guide exists  

---

**Testing Guide Version:** 1.0  
**Last Updated:** December 12, 2024  
**Status:** Ready for Testing

