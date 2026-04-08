# Member Ticket Feature — Design Spec

**Date:** 2026-04-08  
**Status:** Approved

---

## Overview

Add a ticket system that lets admins and store managers award positive-score tickets to members. Each ticket records a title, score (≥ 1), and optional note. The system aggregates scores per member with a month/year filter and displays an all-time cumulative total alongside the monthly view.

---

## Requirements

1. Admins and store managers can create, edit, and delete tickets for members in their store.
2. Each ticket has: title (required), score (integer ≥ 1, required), note (optional).
3. Scores are always positive.
4. A dedicated Tickets page shows a per-member leaderboard filtered by month + year, plus all-time totals.
5. Members can view their own tickets and score totals (monthly + all-time) in AccountSettings.

---

## Data Model

### `Ticket` (MongoDB collection: `tickets`)

```ts
{
  store:     ObjectId → Store       // required, indexed
  member:    ObjectId → User        // required, indexed
  title:     String                 // required, max 200 chars, trimmed
  score:     Number                 // required, integer, min 1
  note:      String                 // optional, trimmed
  createdBy: {
    userId:   ObjectId → User
    userName: String
  }
  createdAt: Date                   // auto via timestamps
  updatedAt: Date                   // auto via timestamps
}
```

**Indexes:**
- `{ store: 1, createdAt: -1 }` — list by store
- `{ store: 1, member: 1, createdAt: -1 }` — per-member queries
- `{ member: 1, createdAt: -1 }` — member's own ticket view

---

## API

Base path: `/api/ticket`  
All routes require `isVerifiedUser` + `storeContext` middleware.

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| GET | `/` | isVerifiedUser, storeContext, isStoreRole("Owner","Manager") | List tickets; query params: `memberId`, `month`, `year`, `page`, `limit` |
| POST | `/` | isVerifiedUser, storeContext, isStoreRole("Owner","Manager") | Create ticket |
| PUT | `/:id` | isVerifiedUser, storeContext, isStoreRole("Owner","Manager") | Edit ticket (same store check) |
| DELETE | `/:id` | isVerifiedUser, storeContext, isStoreRole("Owner","Manager") | Delete ticket (same store check) |
| GET | `/summary` | isVerifiedUser, storeContext, isStoreRole("Owner","Manager") | Per-member score summary; query: `month`, `year` → returns monthly + all-time per member |
| GET | `/my-tickets` | isVerifiedUser, storeContext | Own tickets; query: `month`, `year` → returns ticket list + monthlyTotal + allTimeTotal |

### Summary response shape (`GET /summary`)
```json
{
  "success": true,
  "data": {
    "month": 4,
    "year": 2026,
    "members": [
      {
        "memberId": "...",
        "memberName": "...",
        "memberRole": "...",
        "monthlyScore": 85,
        "monthlyCount": 5,
        "allTimeScore": 340,
        "allTimeCount": 22
      }
    ]
  }
}
```

### My-tickets response shape (`GET /my-tickets`)
```json
{
  "success": true,
  "data": {
    "month": 4,
    "year": 2026,
    "monthlyScore": 30,
    "monthlyCount": 3,
    "allTimeScore": 120,
    "allTimeCount": 14,
    "tickets": [
      { "_id": "...", "title": "...", "score": 10, "note": "...", "createdAt": "..." }
    ]
  }
}
```

---

## Backend Files

| File | Action |
|------|--------|
| `pos-backend/models/ticketModel.ts` | New — Mongoose model |
| `pos-backend/controllers/ticketController.ts` | New — CRUD + summary + my-tickets |
| `pos-backend/routes/ticketRoute.ts` | New — Express router |
| `pos-backend/app.ts` | Modified — mount `app.use("/api/ticket", ticketRoute)` |

---

## Frontend Files

| File | Action |
|------|--------|
| `pos-frontend/src/pages/Tickets.jsx` | New — dedicated Tickets management page |
| `pos-frontend/src/components/tickets/TicketModal.jsx` | New — create/edit ticket modal |
| `pos-frontend/src/redux/slices/ticketSlice.js` | New — Redux state for tickets + summary |
| `pos-frontend/src/https/ticketApi.js` | New — API helper functions |
| `pos-frontend/src/pages/AccountSettings.jsx` | Modified — add "My Tickets" section |
| Router config | Modified — add `/tickets` route |

---

## Frontend: Tickets Page (`/tickets`)

**Access:** Admin and store managers only (guarded by role check).

**Layout:**
1. **Header row**: page title + "New Ticket" button + month/year picker
2. **Summary cards** (4 cards):
   - Total Tickets This Month
   - Total Score This Month
   - All-Time Total Score (across all members)
   - Top Scorer This Month (name + score)
3. **Leaderboard table**: columns — Rank, Member, Role, Tickets (month), Score (month), All-Time Score. Sorted by monthly score descending.
4. **Tickets list**: paginated list of all tickets for selected month. Each row: member name, title, score, note, date, edit/delete actions.

---

## Frontend: AccountSettings — My Tickets Section

Added below the existing "Salary Calculator" section.

**Layout:**
1. **Section header** + month/year picker (same `selectedMonth`/`selectedYear` state reused or separate)
2. **Cards row** (3 cards):
   - Tickets This Month (count)
   - Score This Month
   - All-Time Score
3. **Collapsible ticket list**: each ticket shows title, score badge, optional note, date

---

## Access Control Summary

| Action | Admin | Owner | Manager | Staff |
|--------|-------|-------|---------|-------|
| Create/Edit/Delete ticket | ✅ | ✅ | ✅ | ❌ |
| View summary/leaderboard | ✅ | ✅ | ✅ | ❌ |
| View own tickets (my-tickets) | ✅ | ✅ | ✅ | ✅ |

---

## Validation Rules

- `title`: required, non-empty after trim, max 200 chars
- `score`: required, integer, min 1
- `note`: optional, trimmed
- `member`: must be a valid User who is assigned to the same store (verified via StoreUser lookup)
- Edit/Delete: ticket's `store` field must match `req.store._id` (prevents cross-store access)

---

## Error Cases

| Condition | HTTP Status |
|-----------|-------------|
| Missing store context | 400 |
| Member not found or not in store | 400 |
| score < 1 or non-integer | 400 |
| title missing | 400 |
| Ticket not found | 404 |
| Insufficient store role | 403 |

---

## Out of Scope

- Negative scores / penalty tickets
- Ticket categories
- Charts / trend graphs (can be added later as Approach B extension)
- Notifications when a ticket is issued
