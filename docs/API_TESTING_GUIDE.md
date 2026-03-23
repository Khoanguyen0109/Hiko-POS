# 🧪 API Testing Guide - Schedule Management

## ✅ Correct API URLs

All API endpoints require the `/api` prefix because it's registered in `app.js` as:
```javascript
app.use("/api/shift-template", require("./routes/shiftTemplateRoute"));
app.use("/api/schedule", require("./routes/scheduleRoute"));
```

---

## 📍 Shift Template Endpoints

### 1. Get Active Shift Templates
```bash
# ✅ CORRECT URL
GET http://localhost:3000/api/shift-template/active

# ❌ WRONG URL
GET http://localhost:3000/shift-template/active
```

**cURL Test:**
```bash
curl -X GET http://localhost:3000/api/shift-template/active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "name": "Morning Shift",
      "shortName": "AM",
      "startTime": "09:00",
      "endTime": "17:00",
      "color": "#4ECDC4",
      "isActive": true
    }
  ]
}
```

---

### 2. Get All Shift Templates (Admin)
```bash
# ✅ CORRECT URL
GET http://localhost:3000/api/shift-template

# With query params
GET http://localhost:3000/api/shift-template?isActive=true
```

**cURL Test:**
```bash
curl -X GET http://localhost:3000/api/shift-template \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Create Shift Template (Admin)
```bash
# ✅ CORRECT URL
POST http://localhost:3000/api/shift-template
```

**cURL Test:**
```bash
curl -X POST http://localhost:3000/api/shift-template \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Evening Shift",
    "shortName": "PM",
    "startTime": "17:00",
    "endTime": "23:00",
    "color": "#FF6B6B",
    "description": "Evening operations"
  }'
```

---

## 📅 Schedule Endpoints

### 1. Get Schedules by Week
```bash
# ✅ CORRECT URL
GET http://localhost:3000/api/schedule/week/{year}/{week}

# Example: Get week 50 of 2024
GET http://localhost:3000/api/schedule/week/2024/50
```

**cURL Test:**
```bash
curl -X GET http://localhost:3000/api/schedule/week/2024/50 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "date": "2024-12-16T00:00:00.000Z",
      "shiftTemplate": {
        "_id": "...",
        "name": "Morning Shift",
        "startTime": "09:00",
        "endTime": "17:00"
      },
      "assignedMembers": [
        {
          "member": {
            "_id": "...",
            "name": "John Doe",
            "email": "john@example.com"
          },
          "status": "scheduled"
        }
      ],
      "year": 2024,
      "weekNumber": 50
    }
  ]
}
```

---

### 2. Create Schedule
```bash
# ✅ CORRECT URL
POST http://localhost:3000/api/schedule
```

**cURL Test:**
```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2024-12-16",
    "shiftTemplateId": "SHIFT_TEMPLATE_ID",
    "memberIds": [],
    "year": 2024,
    "weekNumber": 50
  }'
```

---

### 3. Assign Member to Schedule
```bash
# ✅ CORRECT URL
PATCH http://localhost:3000/api/schedule/{scheduleId}/assign
```

**cURL Test:**
```bash
curl -X PATCH http://localhost:3000/api/schedule/SCHEDULE_ID/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "memberId": "MEMBER_ID"
  }'
```

---

### 4. Unassign Member from Schedule
```bash
# ✅ CORRECT URL
PATCH http://localhost:3000/api/schedule/{scheduleId}/unassign
```

**cURL Test:**
```bash
curl -X PATCH http://localhost:3000/api/schedule/SCHEDULE_ID/unassign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "memberId": "MEMBER_ID"
  }'
```

---

## 🔑 Getting Authentication Token

### 1. Login to get token
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

### 2. Use token in subsequent requests
Copy the `accessToken` from login response and use it:
```bash
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🧪 Quick Test Sequence

### Step 1: Login
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"khoanguyen0109.99@gmail.com","password":"YOUR_PASSWORD"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"
```

### Step 2: Test Active Shift Templates
```bash
curl -X GET http://localhost:3000/api/shift-template/active \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### Step 3: Test Get Schedules by Week
```bash
curl -X GET http://localhost:3000/api/schedule/week/2024/50 \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### Step 4: Test Create Schedule
```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2024-12-16",
    "shiftTemplateId": "YOUR_SHIFT_TEMPLATE_ID",
    "memberIds": [],
    "year": 2024,
    "weekNumber": 50
  }' \
  | jq
```

---

## 🔍 Common Issues

### Issue 1: 404 Not Found
**Symptom:** `Cannot GET /shift-template/active`

**Problem:** Missing `/api` prefix

**Solution:** 
```bash
# ❌ Wrong
http://localhost:3000/shift-template/active

# ✅ Correct
http://localhost:3000/api/shift-template/active
```

---

### Issue 2: 401 Unauthorized
**Symptom:** `Unauthorized`

**Problem:** Missing or invalid token

**Solution:** 
1. Login to get fresh token
2. Add Authorization header
3. Check token format: `Bearer YOUR_TOKEN`

---

### Issue 3: 403 Forbidden
**Symptom:** `Forbidden`

**Problem:** Not admin user

**Solution:** 
- Login with admin account
- Check user role in database

---

## 📊 All Schedule Management Endpoints

```
# Shift Templates
GET    /api/shift-template           - Get all templates (Admin)
GET    /api/shift-template/active    - Get active templates
POST   /api/shift-template           - Create template (Admin)
GET    /api/shift-template/:id       - Get template by ID (Admin)
PUT    /api/shift-template/:id       - Update template (Admin)
DELETE /api/shift-template/:id       - Delete template (Admin)
PATCH  /api/shift-template/:id/toggle-active - Toggle active status (Admin)

# Schedules
GET    /api/schedule                    - Get all schedules (Admin)
GET    /api/schedule/week/:year/:week   - Get schedules by week (Admin)
GET    /api/schedule/date/:date         - Get schedules by date (Admin)
GET    /api/schedule/range              - Get schedules by date range (Admin)
GET    /api/schedule/member/:memberId   - Get schedules by member (Admin)
GET    /api/schedule/my-schedule        - Get own schedules (Member)
POST   /api/schedule                    - Create schedule (Admin)
POST   /api/schedule/bulk               - Bulk create schedules (Admin)
GET    /api/schedule/:id                - Get schedule by ID (Admin)
PUT    /api/schedule/:id                - Update schedule (Admin)
DELETE /api/schedule/:id                - Delete schedule (Admin)
PATCH  /api/schedule/:id/assign         - Assign member (Admin)
PATCH  /api/schedule/:id/unassign       - Unassign member (Admin)
PATCH  /api/schedule/:id/status         - Update member status (Admin)
```

---

## 🎯 Frontend API Calls

The frontend uses `axiosWrapper` which already has `baseURL: "http://localhost:3000/api"`, so frontend API calls should NOT include `/api`:

```javascript
// ✅ CORRECT - Frontend
axiosWrapper.get("/shift-template/active")
// Results in: http://localhost:3000/api/shift-template/active

// ❌ WRONG - Frontend
axiosWrapper.get("/api/shift-template/active")
// Results in: http://localhost:3000/api/api/shift-template/active (404)
```

---

## ✅ Summary

### Direct Browser/Postman/cURL:
- ✅ Always use `/api` prefix
- Example: `http://localhost:3000/api/shift-template/active`

### Frontend Code:
- ✅ Never use `/api` prefix (axiosWrapper adds it)
- Example: `axiosWrapper.get("/shift-template/active")`

---

**Last Updated:** December 14, 2024  
**Backend Port:** 3000  
**Status:** All endpoints fixed and tested ✅

