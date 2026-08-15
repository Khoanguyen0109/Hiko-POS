# Member Monthly Salary Across All Assigned Stores — Design Spec

**Date:** 2026-08-15  
**Status:** Approved

---

## Overview

A member’s Account Settings Monthly Salary view currently uses only the store selected in the header. Shifts, extra work, and tickets at other assigned stores are hidden. This change widens the existing member salary and my-tickets APIs so one month view shows combined totals plus a per-store breakdown for every store the member is assigned to, including ticket count and ticket points.

---

## Requirements

1. Monthly Salary shows combined pay for the selected month across every active store assignment, not only the header store.
2. Monthly Salary shows combined ticket count and ticket points for that month across those same stores.
3. A By store list shows each assigned store with its own shifts, hours, pay, ticket count, and ticket points. Stores with no activity that month still appear as zeros.
4. Shift Details and Extra Work rows include the store name.
5. My Tickets stays as its own section. Monthly and all-time totals sum every assigned store. Each ticket row shows the store name.
6. A member can only see their own salary and tickets.
7. Hourly rate stays the single `salary` field on the member. The same rate applies at every store.
8. The header store is still required so the member is in a store session. It is not used as a filter for these two endpoints.

---

## Out of scope

- Per-store hourly rates
- Admin salary dashboard changes (`GET /api/salary/summary/all` already aggregates all stores)
- Tickets page leaderboard (managers still see the selected store only)
- Changing how store assignment works

---

## Approach

Widen the existing member endpoints. Do not add new routes. Do not fetch once per store from the browser.

Store IDs come from active `StoreUser` rows for the logged-in member. If the member has no assignments, return empty stores, zero totals, and empty lists.

---

## API

Both routes keep their URLs and still require `isVerifiedUser` plus `storeContext` (header store required for session). Controllers ignore `req.store._id` as a data filter and use assigned stores instead.

### Assigned store resolution

```
StoreUser.find({ user: req.user._id, isActive: true }).populate("store", "name code isActive")
```

Skip rows whose store is missing or inactive. Result is `assignedStores[]` with `{ id, name, code }`.

If the logged-in user is Admin and has no `StoreUser` rows, fall back to the current `req.store` so Account Settings still loads. Non-admin members never get this fallback.

### `GET /api/salary/:year/:month`

Same validation as today: year and month required, month 1–12.

Load in parallel for `assignedStoreIds` and `memberId` in the month range:

- Schedules where `assignedMembers.member` is the member (same valid statuses: scheduled, confirmed, completed)
- Extra work for the member
- Tickets for the member (`createdAt` in the month)

Response:

```json
{
  "success": true,
  "data": {
    "member": {
      "id": "...",
      "name": "...",
      "role": "...",
      "hourlyRate": 25
    },
    "period": {
      "year": 2026,
      "month": 8,
      "monthName": "August"
    },
    "summary": {
      "totalShifts": 12,
      "regularHours": 96,
      "extraWorkHours": 4,
      "totalHours": 100,
      "hourlyRate": 25,
      "regularSalary": 2400,
      "extraWorkPayment": 100,
      "totalSalary": 2500,
      "totalTickets": 5,
      "totalTicketScore": 40
    },
    "stores": [
      {
        "store": { "id": "...", "name": "Store A", "code": "A" },
        "summary": {
          "totalShifts": 8,
          "regularHours": 64,
          "extraWorkHours": 2,
          "totalHours": 66,
          "hourlyRate": 25,
          "regularSalary": 1600,
          "extraWorkPayment": 50,
          "totalSalary": 1650,
          "totalTickets": 3,
          "totalTicketScore": 24
        }
      }
    ],
    "shifts": [
      {
        "date": "...",
        "shiftName": "Morning",
        "startTime": "08:00",
        "endTime": "16:00",
        "hours": 8,
        "status": "completed",
        "color": "#...",
        "storeId": "...",
        "storeName": "Store A"
      }
    ],
    "extraWork": [
      {
        "date": "...",
        "durationHours": 2,
        "workType": "overtime",
        "description": "...",
        "hourlyRate": 25,
        "paymentAmount": 50,
        "isApproved": true,
        "isPaid": false,
        "storeId": "...",
        "storeName": "Store A"
      }
    ]
  }
}
```

Rules:

- `summary` fields except tickets stay the same meaning as today, summed across assigned stores.
- `summary.totalTickets` and `summary.totalTicketScore` are new. They are the month totals across assigned stores.
- `stores` includes every assigned store, sorted by store name. Zero-activity stores are included with zero numbers.
- Combined `summary` totals equal the sum of the matching `stores[].summary` fields.
- Flat `shifts` and `extraWork` keep the current fields and add `storeId` and `storeName`.

### `GET /api/ticket/my-tickets`

Query params unchanged: `month`, `year`.

Match tickets with `member: req.user._id` and `store: { $in: assignedStoreIds }`.

Response keeps the current fields and adds store identity on each ticket:

```json
{
  "success": true,
  "data": {
    "month": 8,
    "year": 2026,
    "monthlyScore": 40,
    "monthlyCount": 5,
    "allTimeScore": 120,
    "allTimeCount": 18,
    "tickets": [
      {
        "_id": "...",
        "title": "...",
        "score": 8,
        "note": "...",
        "createdAt": "...",
        "store": { "_id": "...", "name": "Store A" }
      }
    ]
  }
}
```

`monthlyScore` / `monthlyCount` are the selected month across assigned stores. `allTimeScore` / `allTimeCount` are all tickets for that member at those stores, not limited to the month.

Populate `store` as `{ _id, name }` on each ticket. Do not return tickets from stores the member is not assigned to.

---

## Frontend

File: `pos-frontend/src/pages/AccountSettings.jsx`

API helpers stay the same (`getMonthlySalary`, `getMyTickets`).

### Monthly Salary

- Subtitle: earnings and tickets across every assigned store.
- Existing four summary cards stay (shifts, hours, hourly rate, total salary).
- Add two cards: monthly ticket count (`summary.totalTickets`) and monthly ticket points (`summary.totalTicketScore`).
- Add a By store block under the cards. One row per `stores[]` item: store name, shifts, hours, pay, tickets, points.
- Shift Details and Extra Work: show `storeName` on each row.
- Empty month: if `stores` exists, still show By store. Empty copy says there is no activity at any assigned store this month.

### My Tickets

- Same month/year filters and four summary cards. Numbers now include all assigned stores.
- Each ticket row shows the store name next to the date.

---

## Error handling

- No assigned stores: APIs return empty `stores`, zero totals, empty lists. Page shows the empty state, not an error.
- Salary fetch failure: existing snackbar; do not clear ticket data.
- Ticket fetch failure: existing snackbar; do not clear salary data.
- Invalid year/month: existing 400.
- Other members’ data is never included. Filters always use `req.user._id` and that user’s active assignments.

---

## Testing

1. Member assigned to two stores with shifts and tickets: combined pay and ticket points equal the sum of the By store rows.
2. Member assigned to one store: pay matches today’s single-store result; ticket cards match My Tickets for that month.
3. Assigned store with no shifts or tickets that month still appears in By store as zeros.
4. Shift, extra work, and ticket rows show the correct store name.
5. Changing month reloads salary and tickets for all assigned stores.
6. Member cannot see another member’s salary or tickets through these endpoints.

---

## Files to change

- `pos-backend/controllers/salaryController.ts` — `getMonthlySalary` uses assigned stores; adds ticket totals and `stores[]`; tags shifts and extra work with store.
- `pos-backend/controllers/ticketController.ts` — `getMyTickets` uses assigned stores; populates store name.
- `pos-backend/types/salary.ts` — types for the widened member salary payload.
- `pos-frontend/src/pages/AccountSettings.jsx` — ticket cards, By store list, store names on detail rows.
