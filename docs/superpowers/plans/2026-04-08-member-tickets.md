# Member Tickets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ticket system where admins/store managers award positive-score tickets to members, with a leaderboard summary page and a personal view in AccountSettings.

**Architecture:** New `Ticket` Mongoose model stores store-scoped tickets linked to members. Six REST endpoints cover CRUD + summary + member self-view, all behind `isVerifiedUser` + `storeContext` with `isStoreRole("Owner","Manager")` guarding management routes. The frontend adds a dedicated `/tickets` page with leaderboard/summary and a "My Tickets" section in AccountSettings.

**Tech Stack:** Node.js + Express + TypeScript + Mongoose (backend); React 18 + Vite + Redux Toolkit + Tailwind CSS (frontend); axiosWrapper for API calls; react-icons for icons; notistack for toasts.

---

## File Map

**New files:**
- `pos-backend/models/ticketModel.ts`
- `pos-backend/controllers/ticketController.ts`
- `pos-backend/routes/ticketRoute.ts`
- `pos-frontend/src/https/ticketApi.js`
- `pos-frontend/src/redux/slices/ticketSlice.js`
- `pos-frontend/src/components/tickets/TicketModal.jsx`
- `pos-frontend/src/pages/Tickets.jsx`

**Modified files:**
- `pos-backend/app.ts` — mount `/api/ticket` route
- `pos-frontend/src/redux/store.js` — register `ticketReducer`
- `pos-frontend/src/https/index.js` — re-export ticket API helpers
- `pos-frontend/src/constants/index.js` — add `ROUTES.TICKETS`, `PROTECTED_ROUTES` entry
- `pos-frontend/src/pages/index.js` — export `Tickets` page
- `pos-frontend/src/App.jsx` — add `Tickets` to `COMPONENT_MAP`
- `pos-frontend/src/components/shared/Sidebar.jsx` — add Tickets nav item
- `pos-frontend/src/pages/AccountSettings.jsx` — add "My Tickets" section

---

## Task 1: Backend — Ticket Model

**Files:**
- Create: `pos-backend/models/ticketModel.ts`

- [ ] **Step 1: Create the model file**

```ts
// pos-backend/models/ticketModel.ts
// @ts-nocheck
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: "Score must be an integer"
        }
    },
    note: {
        type: String,
        trim: true,
        default: ""
    },
    createdBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, trim: true }
    }
}, { timestamps: true });

ticketSchema.index({ store: 1, createdAt: -1 });
ticketSchema.index({ store: 1, member: 1, createdAt: -1 });
ticketSchema.index({ member: 1, createdAt: -1 });

export default mongoose.model("Ticket", ticketSchema);
```

- [ ] **Step 2: Commit**

```bash
cd /Users/khn6352/out/Hiko-POS
git add pos-backend/models/ticketModel.ts
git commit -m "feat: add Ticket mongoose model"
```

---

## Task 2: Backend — Ticket Controller

**Files:**
- Create: `pos-backend/controllers/ticketController.ts`

- [ ] **Step 1: Create the controller file**

```ts
// pos-backend/controllers/ticketController.ts
// @ts-nocheck
import type { MongoFilter } from "../types/mongo.js";

import createHttpError from "http-errors";
import Ticket from "../models/ticketModel.js";
import StoreUser from "../models/storeUserModel.js";
import User from "../models/userModel.js";

// GET /api/ticket — list tickets for the active store
const getTickets = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const { memberId, month, year, page = 1, limit = 50 } = req.query;

        const pageNum  = Math.max(1, parseInt(page,  10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const skip     = (pageNum - 1) * limitNum;

        const filter: MongoFilter = { store: storeId };

        if (memberId) filter.member = memberId;

        if (month && year) {
            const y = parseInt(year, 10);
            const m = parseInt(month, 10);
            filter.createdAt = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
        } else if (year) {
            const y = parseInt(year, 10);
            filter.createdAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(filter)
                .populate({ path: "member", select: "name email role" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Ticket.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: tickets,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNext: pageNum * limitNum < total,
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/ticket — create a ticket
const createTicket = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const { memberId, title, score, note } = req.body;

        if (!memberId || !title || score === undefined) {
            return next(createHttpError(400, "memberId, title, and score are required."));
        }

        const scoreNum = Number(score);
        if (!Number.isInteger(scoreNum) || scoreNum < 1) {
            return next(createHttpError(400, "Score must be an integer of at least 1."));
        }

        if (!title.trim()) {
            return next(createHttpError(400, "Title cannot be empty."));
        }

        if (title.trim().length > 200) {
            return next(createHttpError(400, "Title cannot exceed 200 characters."));
        }

        // Verify member belongs to this store
        const storeUser = await StoreUser.findOne({ user: memberId, store: storeId, isActive: true });
        if (!storeUser) {
            const exists = await User.exists({ _id: memberId });
            if (!exists) return next(createHttpError(400, "Member not found."));
            return next(createHttpError(400, "Member is not assigned to this store."));
        }

        const ticket = await Ticket.create({
            store: storeId,
            member: memberId,
            title: title.trim(),
            score: scoreNum,
            note: note ? note.trim() : "",
            createdBy: {
                userId: req.user._id,
                userName: req.user.name
            }
        });

        const populated = await Ticket.findById(ticket._id)
            .populate({ path: "member", select: "name email role" })
            .lean();

        res.status(201).json({
            success: true,
            message: "Ticket created successfully!",
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/ticket/:id — update a ticket
const updateTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const storeId = req.store._id;
        const { title, score, note } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) return next(createHttpError(404, "Ticket not found."));

        if (ticket.store.toString() !== storeId.toString()) {
            return next(createHttpError(403, "Access denied."));
        }

        if (score !== undefined) {
            const scoreNum = Number(score);
            if (!Number.isInteger(scoreNum) || scoreNum < 1) {
                return next(createHttpError(400, "Score must be an integer of at least 1."));
            }
            ticket.score = scoreNum;
        }

        if (title !== undefined) {
            if (!title.trim()) return next(createHttpError(400, "Title cannot be empty."));
            if (title.trim().length > 200) return next(createHttpError(400, "Title cannot exceed 200 characters."));
            ticket.title = title.trim();
        }

        if (note !== undefined) ticket.note = note.trim();

        await ticket.save();

        const updated = await Ticket.findById(id)
            .populate({ path: "member", select: "name email role" })
            .lean();

        res.status(200).json({
            success: true,
            message: "Ticket updated successfully!",
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/ticket/:id — delete a ticket
const deleteTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const storeId = req.store._id;

        const ticket = await Ticket.findById(id);
        if (!ticket) return next(createHttpError(404, "Ticket not found."));

        if (ticket.store.toString() !== storeId.toString()) {
            return next(createHttpError(403, "Access denied."));
        }

        await Ticket.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Ticket deleted successfully!"
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/ticket/summary — per-member leaderboard with monthly + all-time totals
const getTicketSummary = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const now = new Date();
        const targetMonth = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
        const targetYear  = parseInt(req.query.year  as string, 10) || now.getFullYear();

        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        const monthEnd   = new Date(targetYear, targetMonth, 1);

        const [monthlyAgg, allTimeAgg] = await Promise.all([
            Ticket.aggregate([
                { $match: { store: storeId, createdAt: { $gte: monthStart, $lt: monthEnd } } },
                { $group: { _id: "$member", monthlyScore: { $sum: "$score" }, monthlyCount: { $sum: 1 } } }
            ]),
            Ticket.aggregate([
                { $match: { store: storeId } },
                { $group: { _id: "$member", allTimeScore: { $sum: "$score" }, allTimeCount: { $sum: 1 } } }
            ])
        ]);

        const monthlyMap = new Map(monthlyAgg.map(r => [r._id.toString(), r]));
        const allTimeMap = new Map(allTimeAgg.map(r => [r._id.toString(), r]));
        const memberIds  = [...new Set([...monthlyMap.keys(), ...allTimeMap.keys()])];

        const users = await User.find({ _id: { $in: memberIds } }).select("name role").lean();

        const members = users.map(u => {
            const id      = u._id.toString();
            const monthly = monthlyMap.get(id) || { monthlyScore: 0, monthlyCount: 0 };
            const allTime = allTimeMap.get(id)  || { allTimeScore: 0, allTimeCount: 0 };
            return {
                memberId:     u._id,
                memberName:   u.name,
                memberRole:   u.role,
                monthlyScore: monthly.monthlyScore,
                monthlyCount: monthly.monthlyCount,
                allTimeScore: allTime.allTimeScore,
                allTimeCount: allTime.allTimeCount
            };
        }).sort((a, b) => b.monthlyScore - a.monthlyScore);

        res.status(200).json({
            success: true,
            data: { month: targetMonth, year: targetYear, members }
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/ticket/my-tickets — logged-in member's own tickets + totals
const getMyTickets = async (req, res, next) => {
    try {
        const storeId  = req.store._id;
        const memberId = req.user._id;
        const now = new Date();
        const targetMonth = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
        const targetYear  = parseInt(req.query.year  as string, 10) || now.getFullYear();

        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        const monthEnd   = new Date(targetYear, targetMonth, 1);

        const [monthlyTickets, allTimeAgg] = await Promise.all([
            Ticket.find({ store: storeId, member: memberId, createdAt: { $gte: monthStart, $lt: monthEnd } })
                .sort({ createdAt: -1 })
                .lean(),
            Ticket.aggregate([
                { $match: { store: storeId, member: memberId } },
                { $group: { _id: null, allTimeScore: { $sum: "$score" }, allTimeCount: { $sum: 1 } } }
            ])
        ]);

        const monthlyScore = monthlyTickets.reduce((sum, t) => sum + t.score, 0);
        const allTimeScore = allTimeAgg[0]?.allTimeScore || 0;
        const allTimeCount = allTimeAgg[0]?.allTimeCount || 0;

        res.status(200).json({
            success: true,
            data: {
                month: targetMonth,
                year:  targetYear,
                monthlyScore,
                monthlyCount: monthlyTickets.length,
                allTimeScore,
                allTimeCount,
                tickets: monthlyTickets
            }
        });
    } catch (error) {
        next(error);
    }
};

export { getTickets, createTicket, updateTicket, deleteTicket, getTicketSummary, getMyTickets };
```

- [ ] **Step 2: Commit**

```bash
git add pos-backend/controllers/ticketController.ts
git commit -m "feat: add ticket controller (CRUD, summary, my-tickets)"
```

---

## Task 3: Backend — Route + Register in app.ts

**Files:**
- Create: `pos-backend/routes/ticketRoute.ts`
- Modify: `pos-backend/app.ts`

- [ ] **Step 1: Create the route file**

```ts
// pos-backend/routes/ticketRoute.ts
import express from "express";
import {
    getTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicketSummary,
    getMyTickets
} from "../controllers/ticketController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext, isStoreRole } from "../middlewares/storeContext.js";

const router = express.Router();

// Any store member can view their own tickets
router.get("/my-tickets", isVerifiedUser, storeContext, getMyTickets);

// Owner/Manager/Admin only
router.get("/summary",    isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), getTicketSummary);
router.route("/")
    .get( isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), getTickets)
    .post(isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), createTicket);
router.route("/:id")
    .put(   isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), updateTicket)
    .delete(isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), deleteTicket);

export default router;
```

- [ ] **Step 2: Register in `pos-backend/app.ts`**

In `app.ts`, add the import after the existing imports (after `extraWorkRoute`):

```ts
import ticketRoute from "./routes/ticketRoute.js";
```

And add the route mount after `app.use("/api/extra-work", extraWorkRoute);`:

```ts
app.use("/api/ticket", ticketRoute);
```

- [ ] **Step 3: Commit**

```bash
git add pos-backend/routes/ticketRoute.ts pos-backend/app.ts
git commit -m "feat: add ticket route and mount in app"
```

---

## Task 4: Frontend — API Helper

**Files:**
- Create: `pos-frontend/src/https/ticketApi.js`
- Modify: `pos-frontend/src/https/index.js`

- [ ] **Step 1: Create `ticketApi.js`**

```js
// pos-frontend/src/https/ticketApi.js
import { axiosWrapper } from "./axiosWrapper";

export const getTickets = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) q.append(k, v);
  });
  const qs = q.toString();
  return axiosWrapper.get(`/api/ticket${qs ? `?${qs}` : ''}`);
};

export const createTicket = (data) => axiosWrapper.post("/api/ticket", data);

export const updateTicket = ({ ticketId, ...data }) =>
  axiosWrapper.put(`/api/ticket/${ticketId}`, data);

export const deleteTicket = (ticketId) =>
  axiosWrapper.delete(`/api/ticket/${ticketId}`);

export const getTicketSummary = (params = {}) => {
  const q = new URLSearchParams();
  if (params.month) q.append('month', params.month);
  if (params.year)  q.append('year',  params.year);
  const qs = q.toString();
  return axiosWrapper.get(`/api/ticket/summary${qs ? `?${qs}` : ''}`);
};

export const getMyTickets = (params = {}) => {
  const q = new URLSearchParams();
  if (params.month) q.append('month', params.month);
  if (params.year)  q.append('year',  params.year);
  const qs = q.toString();
  return axiosWrapper.get(`/api/ticket/my-tickets${qs ? `?${qs}` : ''}`);
};
```

- [ ] **Step 2: Re-export from `pos-frontend/src/https/index.js`**

Append to the bottom of `index.js`:

```js
// Ticket Endpoints
export {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketSummary,
  getMyTickets
} from "./ticketApi";
```

- [ ] **Step 3: Commit**

```bash
git add pos-frontend/src/https/ticketApi.js pos-frontend/src/https/index.js
git commit -m "feat: add ticket API helpers"
```

---

## Task 5: Frontend — Redux Slice + Store Registration

**Files:**
- Create: `pos-frontend/src/redux/slices/ticketSlice.js`
- Modify: `pos-frontend/src/redux/store.js`

- [ ] **Step 1: Create `ticketSlice.js`**

```js
// pos-frontend/src/redux/slices/ticketSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketSummary,
  getMyTickets
} from "../../https/ticketApi";

export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (params, { rejectWithValue }) => {
    try {
      const res = await getTickets(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch tickets");
    }
  }
);

export const fetchTicketSummary = createAsyncThunk(
  "tickets/fetchSummary",
  async (params, { rejectWithValue }) => {
    try {
      const res = await getTicketSummary(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch ticket summary");
    }
  }
);

export const fetchMyTickets = createAsyncThunk(
  "tickets/fetchMyTickets",
  async (params, { rejectWithValue }) => {
    try {
      const res = await getMyTickets(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch your tickets");
    }
  }
);

export const addTicket = createAsyncThunk(
  "tickets/addTicket",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createTicket(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create ticket");
    }
  }
);

export const editTicket = createAsyncThunk(
  "tickets/editTicket",
  async ({ ticketId, ...data }, { rejectWithValue }) => {
    try {
      const res = await updateTicket({ ticketId, ...data });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update ticket");
    }
  }
);

export const removeTicket = createAsyncThunk(
  "tickets/removeTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      await deleteTicket(ticketId);
      return ticketId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete ticket");
    }
  }
);

const initialState = {
  tickets: [],
  pagination: null,
  loading: false,
  error: null,

  summary: null,
  summaryLoading: false,
  summaryError: null,

  myTickets: null,
  myTicketsLoading: false,
  myTicketsError: null,

  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
};

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearTicketError: (state) => {
      state.error = null;
      state.summaryError = null;
      state.myTicketsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending,    (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchTickets.fulfilled,  (s, a) => { s.loading = false; s.tickets = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchTickets.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchTicketSummary.pending,   (s) => { s.summaryLoading = true;  s.summaryError = null; })
      .addCase(fetchTicketSummary.fulfilled, (s, a) => { s.summaryLoading = false; s.summary = a.payload.data; })
      .addCase(fetchTicketSummary.rejected,  (s, a) => { s.summaryLoading = false; s.summaryError = a.payload; })

      .addCase(fetchMyTickets.pending,   (s) => { s.myTicketsLoading = true;  s.myTicketsError = null; })
      .addCase(fetchMyTickets.fulfilled, (s, a) => { s.myTicketsLoading = false; s.myTickets = a.payload.data; })
      .addCase(fetchMyTickets.rejected,  (s, a) => { s.myTicketsLoading = false; s.myTicketsError = a.payload; })

      .addCase(addTicket.pending,    (s) => { s.createLoading = true;  s.error = null; })
      .addCase(addTicket.fulfilled,  (s, a) => { s.createLoading = false; s.tickets.unshift(a.payload.data); })
      .addCase(addTicket.rejected,   (s, a) => { s.createLoading = false; s.error = a.payload; })

      .addCase(editTicket.pending,   (s) => { s.updateLoading = true;  s.error = null; })
      .addCase(editTicket.fulfilled, (s, a) => {
        s.updateLoading = false;
        const idx = s.tickets.findIndex(t => t._id === a.payload.data._id);
        if (idx !== -1) s.tickets[idx] = a.payload.data;
      })
      .addCase(editTicket.rejected,  (s, a) => { s.updateLoading = false; s.error = a.payload; })

      .addCase(removeTicket.pending,   (s) => { s.deleteLoading = true;  s.error = null; })
      .addCase(removeTicket.fulfilled, (s, a) => { s.deleteLoading = false; s.tickets = s.tickets.filter(t => t._id !== a.payload); })
      .addCase(removeTicket.rejected,  (s, a) => { s.deleteLoading = false; s.error = a.payload; });
  },
});

export const { clearTicketError } = ticketSlice.actions;
export default ticketSlice.reducer;
```

- [ ] **Step 2: Register in `pos-frontend/src/redux/store.js`**

Add import after `import storageAnalyticsReducer from "./slices/storageAnalyticsSlice";`:

```js
import ticketReducer from "./slices/ticketSlice";
```

Add to the `reducer` object after `storageAnalytics: storageAnalyticsReducer,`:

```js
tickets: ticketReducer,
```

- [ ] **Step 3: Commit**

```bash
git add pos-frontend/src/redux/slices/ticketSlice.js pos-frontend/src/redux/store.js
git commit -m "feat: add ticket Redux slice and register in store"
```

---

## Task 6: Frontend — TicketModal Component

**Files:**
- Create: `pos-frontend/src/components/tickets/TicketModal.jsx`

- [ ] **Step 1: Create the component**

```jsx
// pos-frontend/src/components/tickets/TicketModal.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdStar, MdPerson } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { addTicket, editTicket, clearTicketError } from "../../redux/slices/ticketSlice";

const TicketModal = ({ isOpen, onClose, ticket, members }) => {
  const dispatch = useDispatch();
  const { createLoading, updateLoading, error } = useSelector((s) => s.tickets);
  const isEdit = Boolean(ticket);

  const [form, setForm] = useState({ memberId: "", title: "", score: "", note: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (ticket) {
      setForm({
        memberId: ticket.member?._id || ticket.member || "",
        title: ticket.title || "",
        score: String(ticket.score || ""),
        note: ticket.note || "",
      });
    } else {
      setForm({ memberId: "", title: "", score: "", note: "" });
    }
    setErrors({});
  }, [ticket, isOpen]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearTicketError());
    }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};
    if (!isEdit && !form.memberId) e.memberId = "Please select a member";
    if (!form.title.trim()) e.title = "Title is required";
    if (form.title.trim().length > 200) e.title = "Title must be 200 characters or fewer";
    const s = Number(form.score);
    if (!form.score || !Number.isInteger(s) || s < 1) e.score = "Score must be a whole number ≥ 1";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }

    const payload = {
      title: form.title.trim(),
      score: Number(form.score),
      note: form.note.trim(),
    };

    if (isEdit) {
      const result = await dispatch(editTicket({ ticketId: ticket._id, ...payload }));
      if (!result.error) {
        enqueueSnackbar("Ticket updated!", { variant: "success" });
        onClose();
      }
    } else {
      const result = await dispatch(addTicket({ memberId: form.memberId, ...payload }));
      if (!result.error) {
        enqueueSnackbar("Ticket created!", { variant: "success" });
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const loading = createLoading || updateLoading;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#343434]">
          <h2 className="text-[#f5f5f5] text-lg font-semibold flex items-center gap-2">
            <MdStar className="text-[#f6b100]" />
            {isEdit ? "Edit Ticket" : "New Ticket"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#262626] text-[#ababab]">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Member select — only on create */}
          {!isEdit && (
            <div>
              <label className="block text-[#ababab] text-sm mb-1.5 font-medium">
                <MdPerson className="inline mr-1.5" />
                Member
              </label>
              <select
                name="memberId"
                value={form.memberId}
                onChange={handleChange}
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
              >
                <option value="">Select a member…</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
              {errors.memberId && <p className="text-red-400 text-xs mt-1">{errors.memberId}</p>}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[#ababab] text-sm mb-1.5 font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={200}
              placeholder="e.g. Excellent customer service"
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Score */}
          <div>
            <label className="block text-[#ababab] text-sm mb-1.5 font-medium">
              Score <span className="text-[#6a6a6a] text-xs">(whole number ≥ 1)</span>
            </label>
            <input
              type="number"
              name="score"
              value={form.score}
              onChange={handleChange}
              min={1}
              step={1}
              placeholder="10"
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
            />
            {errors.score && <p className="text-red-400 text-xs mt-1">{errors.score}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-[#ababab] text-sm mb-1.5 font-medium">
              Note <span className="text-[#6a6a6a] text-xs">(optional)</span>
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Additional details…"
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-[#343434] text-[#ababab] text-sm font-medium hover:bg-[#262626] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#f6b100] text-[#1a1a1a] text-sm font-semibold hover:bg-[#e5a200] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

TicketModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ticket: PropTypes.object,
  members: PropTypes.array.isRequired,
};

export default TicketModal;
```

- [ ] **Step 2: Commit**

```bash
git add pos-frontend/src/components/tickets/TicketModal.jsx
git commit -m "feat: add TicketModal component"
```

---

## Task 7: Frontend — Tickets Page + Route Registration

**Files:**
- Create: `pos-frontend/src/pages/Tickets.jsx`
- Modify: `pos-frontend/src/pages/index.js`
- Modify: `pos-frontend/src/constants/index.js`
- Modify: `pos-frontend/src/App.jsx`
- Modify: `pos-frontend/src/components/shared/Sidebar.jsx`

- [ ] **Step 1: Create `Tickets.jsx`**

```jsx
// pos-frontend/src/pages/Tickets.jsx
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdAdd, MdEdit, MdDelete, MdStar, MdRefresh, MdCalendarMonth, MdPerson } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import { fetchTickets, fetchTicketSummary, removeTicket, clearTicketError } from "../redux/slices/ticketSlice";
import { fetchStoreMembers } from "../redux/slices/storeSlice";
import BackButton from "../components/shared/BackButton";
import DeleteConfirmationModal from "../components/shared/DeleteConfirmationModal";
import TicketModal from "../components/tickets/TicketModal";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const Tickets = () => {
  const dispatch = useDispatch();
  const { tickets, loading, error, summary, summaryLoading, deleteLoading } = useSelector((s) => s.tickets);
  const { storeMembers } = useSelector((s) => s.store);
  const activeStore = useSelector((s) => s.store.activeStore);
  const { role: userRole } = useSelector((s) => s.user);
  const stores = useSelector((s) => s.store.stores);

  const activeStoreRole = stores.find(s => s._id === activeStore?._id)?.role
    || stores.find(s => s._id === activeStore?._id)?.storeRole;
  const canManage = userRole === "Admin" || activeStoreRole === "Owner" || activeStoreRole === "Manager";

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [showModal,     setShowModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTicket,  setSelectedTicket]  = useState(null);
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "list"

  const loadData = useCallback(() => {
    dispatch(fetchTickets({ month: selectedMonth, year: selectedYear }));
    dispatch(fetchTicketSummary({ month: selectedMonth, year: selectedYear }));
  }, [dispatch, selectedMonth, selectedYear]);

  useEffect(() => {
    document.title = "POS | Tickets";
    if (activeStore?._id) dispatch(fetchStoreMembers(activeStore._id));
  }, [dispatch, activeStore]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearTicketError());
    }
  }, [error, dispatch]);

  const handleCreate = () => { setSelectedTicket(null); setShowModal(true); };
  const handleEdit   = (t)  => { setSelectedTicket(t);  setShowModal(true); };
  const handleDelete = (t)  => { setSelectedTicket(t);  setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    const result = await dispatch(removeTicket(selectedTicket._id));
    if (!result.error) {
      enqueueSnackbar("Ticket deleted!", { variant: "success" });
      setShowDeleteModal(false);
      setSelectedTicket(null);
      dispatch(fetchTicketSummary({ month: selectedMonth, year: selectedYear }));
    }
  };

  const totalMonthlyScore = summary?.members?.reduce((sum, m) => sum + m.monthlyScore, 0) || 0;
  const totalAllTimeScore = summary?.members?.reduce((sum, m) => sum + m.allTimeScore, 0) || 0;
  const topScorer = summary?.members?.[0];

  if (!canManage) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <MdStar className="mx-auto text-6xl text-[#ababab] mb-4" />
          <p className="text-[#ababab] text-lg">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-[#f5f5f5] text-2xl font-bold flex items-center gap-2">
                <MdStar className="text-[#f6b100]" /> Tickets
              </h1>
              <p className="text-[#ababab] text-sm mt-0.5">Member score management</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Month picker */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            {/* Year picker */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-[#262626] border border-[#343434] text-[#ababab] hover:text-[#f5f5f5]"
              title="Refresh"
            >
              <MdRefresh size={18} />
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#f6b100] text-[#1a1a1a] rounded-lg text-sm font-semibold hover:bg-[#e5a200] transition-colors"
            >
              <MdAdd size={18} /> New Ticket
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#262626] rounded-xl p-4 border border-[#343434]">
            <p className="text-[#ababab] text-xs uppercase tracking-wide mb-1">Tickets This Month</p>
            <p className="text-[#f5f5f5] text-2xl font-bold">{tickets.length}</p>
          </div>
          <div className="bg-[#262626] rounded-xl p-4 border border-[#343434]">
            <p className="text-[#ababab] text-xs uppercase tracking-wide mb-1">Score This Month</p>
            <p className="text-[#f6b100] text-2xl font-bold">{totalMonthlyScore}</p>
          </div>
          <div className="bg-[#262626] rounded-xl p-4 border border-[#343434]">
            <p className="text-[#ababab] text-xs uppercase tracking-wide mb-1">All-Time Score</p>
            <p className="text-[#10B981] text-2xl font-bold">{totalAllTimeScore}</p>
          </div>
          <div className="bg-[#262626] rounded-xl p-4 border border-[#343434]">
            <p className="text-[#ababab] text-xs uppercase tracking-wide mb-1">Top Scorer</p>
            {topScorer ? (
              <>
                <p className="text-[#f5f5f5] text-base font-bold truncate">{topScorer.memberName}</p>
                <p className="text-[#f6b100] text-sm">{topScorer.monthlyScore} pts</p>
              </>
            ) : (
              <p className="text-[#ababab] text-sm">—</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#262626] rounded-lg p-1 w-fit">
          {["summary", "list"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-[#f6b100] text-[#1a1a1a]"
                  : "text-[#ababab] hover:text-[#f5f5f5]"
              }`}
            >
              {tab === "summary" ? "Leaderboard" : "Ticket List"}
            </button>
          ))}
        </div>

        {/* Leaderboard Tab */}
        {activeTab === "summary" && (
          <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] overflow-hidden">
            <div className="p-4 border-b border-[#343434]">
              <h2 className="text-[#f5f5f5] font-semibold flex items-center gap-2">
                <MdCalendarMonth className="text-[#f6b100]" />
                Leaderboard — {MONTHS[selectedMonth - 1]} {selectedYear}
              </h2>
            </div>
            {summaryLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f6b100] mx-auto" />
              </div>
            ) : !summary?.members?.length ? (
              <div className="text-center py-12 text-[#ababab]">No tickets for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#343434] text-left">
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium">Rank</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium">Member</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium">Role</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium text-right">Tickets (Month)</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium text-right">Score (Month)</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium text-right">All-Time Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.members.map((m, i) => (
                      <tr key={m.memberId} className="border-b border-[#343434] hover:bg-[#262626] transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            i === 0 ? "bg-[#f6b100] text-[#1a1a1a]" :
                            i === 1 ? "bg-[#6a6a6a] text-[#f5f5f5]" :
                            i === 2 ? "bg-[#8B4513] text-[#f5f5f5]" :
                            "bg-[#343434] text-[#ababab]"
                          }`}>{i + 1}</span>
                        </td>
                        <td className="px-4 py-3 text-[#f5f5f5] text-sm font-medium">{m.memberName}</td>
                        <td className="px-4 py-3 text-[#ababab] text-sm">{m.memberRole}</td>
                        <td className="px-4 py-3 text-[#f5f5f5] text-sm text-right">{m.monthlyCount}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[#f6b100] font-bold">{m.monthlyScore}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[#10B981] font-semibold">{m.allTimeScore}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Ticket List Tab */}
        {activeTab === "list" && (
          <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] overflow-hidden">
            <div className="p-4 border-b border-[#343434]">
              <h2 className="text-[#f5f5f5] font-semibold">
                Tickets — {MONTHS[selectedMonth - 1]} {selectedYear}
              </h2>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f6b100] mx-auto" />
              </div>
            ) : !tickets.length ? (
              <div className="text-center py-12 text-[#ababab]">No tickets for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#343434] text-left">
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium">Member</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium">Title</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium text-right">Score</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium">Note</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium">Date</th>
                      <th className="px-4 py-3 text-[#ababab] text-xs font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t._id} className="border-b border-[#343434] hover:bg-[#262626] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MdPerson className="text-[#ababab]" />
                            <span className="text-[#f5f5f5] text-sm">{t.member?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#f5f5f5] text-sm max-w-[200px] truncate">{t.title}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 bg-[#f6b100]/15 text-[#f6b100] px-2 py-0.5 rounded text-sm font-bold">
                            <MdStar size={12} /> {t.score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#ababab] text-sm max-w-[150px] truncate">{t.note || "—"}</td>
                        <td className="px-4 py-3 text-[#ababab] text-sm whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(t)}
                              className="p-1.5 rounded-lg hover:bg-[#343434] text-[#ababab] hover:text-[#f6b100] transition-colors"
                            >
                              <MdEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(t)}
                              className="p-1.5 rounded-lg hover:bg-[#343434] text-[#ababab] hover:text-red-400 transition-colors"
                            >
                              <MdDelete size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TicketModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedTicket(null); }}
        ticket={selectedTicket}
        members={storeMembers}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedTicket(null); }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Ticket"
        message={`Are you sure you want to delete the ticket "${selectedTicket?.title}"?`}
      />
    </div>
  );
};

export default Tickets;
```

- [ ] **Step 2: Export from `pos-frontend/src/pages/index.js`**

Append to the bottom:

```js
export { default as Tickets } from "./Tickets.jsx"
```

- [ ] **Step 3: Add route constant to `pos-frontend/src/constants/index.js`**

In the `ROUTES` object, add after `STORES: "/stores"`:

```js
TICKETS: "/tickets",
```

In `PROTECTED_ROUTES`, add after the `STORES` entry:

```js
{
  path: ROUTES.TICKETS,
  componentName: "Tickets",
},
```

- [ ] **Step 4: Register in `pos-frontend/src/App.jsx`**

In the `COMPONENT_MAP` object, add after `Stores,`:

```js
Tickets,
```

Also add the import at the top among the pages imports:

```js
Tickets,
```

(i.e. add `Tickets` to the destructured import from `"./pages"`)

- [ ] **Step 5: Add Tickets to Sidebar**

In `pos-frontend/src/components/shared/Sidebar.jsx`, in the `...(isAdmin ? [...] : [])` block that contains the `"Admin"` section, add a Tickets item. Import `MdConfirmationNumber` from `react-icons/md` at the top, then add inside the Admin section items array:

```jsx
{
  path: ROUTES.TICKETS,
  icon: <MdConfirmationNumber size={18} />,
  label: "Tickets",
},
```

Place it after the `Members` entry and before `Stores`.

Full change to the Admin section in `navSections`:

```js
...(isAdmin
  ? [
      {
        label: "Admin",
        items: [
          {
            path: ROUTES.MEMBERS,
            icon: <FaUsers size={18} />,
            label: "Members",
          },
          {
            path: ROUTES.TICKETS,
            icon: <MdConfirmationNumber size={18} />,
            label: "Tickets",
          },
          {
            path: ROUTES.STORES,
            icon: <MdStore size={18} />,
            label: "Stores",
          },
        ],
      },
    ]
  : []),
```

- [ ] **Step 6: Commit**

```bash
git add \
  pos-frontend/src/pages/Tickets.jsx \
  pos-frontend/src/pages/index.js \
  pos-frontend/src/constants/index.js \
  pos-frontend/src/App.jsx \
  pos-frontend/src/components/shared/Sidebar.jsx
git commit -m "feat: add Tickets page, route, and sidebar navigation"
```

---

## Task 8: Frontend — My Tickets Section in AccountSettings

**Files:**
- Modify: `pos-frontend/src/pages/AccountSettings.jsx`

- [ ] **Step 1: Add state for My Tickets**

In `AccountSettings.jsx`, add these state variables after the existing `showExtraWorkDetails` state (around line 41):

```jsx
const [ticketMonth, setTicketMonth] = useState(new Date().getMonth() + 1);
const [ticketYear,  setTicketYear]  = useState(new Date().getFullYear());
const [ticketData,  setTicketData]  = useState(null);
const [ticketLoading, setTicketLoading] = useState(false);
const [showTicketList,  setShowTicketList]  = useState(false);
```

- [ ] **Step 2: Add `getMyTickets` import and fetch function**

Add the import of `getMyTickets` from ticketApi at the top of the file (after existing imports):

```jsx
import { getMyTickets } from "../https/ticketApi";
```

Add the fetch function after `fetchSalaryData`:

```jsx
const fetchTicketData = useCallback(async () => {
  try {
    setTicketLoading(true);
    const response = await getMyTickets({ year: ticketYear, month: ticketMonth });
    setTicketData(response.data.data);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    enqueueSnackbar(error.response?.data?.message || "Failed to fetch ticket data", { variant: "error" });
    setTicketData(null);
  } finally {
    setTicketLoading(false);
  }
}, [ticketYear, ticketMonth]);
```

Add the useEffect to trigger fetch:

```jsx
useEffect(() => {
  fetchTicketData();
}, [fetchTicketData]);
```

- [ ] **Step 3: Add the My Tickets JSX section**

Locate the closing `</div>` of the Salary Calculator section (the block that starts with `{/* Salary Calculator Section */}`). Insert the following block immediately after it (before the Profile Information section):

```jsx
{/* My Tickets Section */}
<div className="bg-[#1f1f1f] rounded-lg border border-[#343434]">
  {/* Header */}
  <div className="p-4 sm:p-6 border-b border-[#343434]">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-[#f5f5f5] text-lg sm:text-xl font-semibold flex items-center gap-2">
          <MdStar size={20} className="text-[#f6b100]" />
          My Tickets
        </h2>
        <p className="text-[#ababab] text-xs sm:text-sm mt-1">Your awarded scores this month</p>
      </div>
      {/* Month/Year pickers */}
      <div className="flex items-center gap-2">
        <select
          value={ticketMonth}
          onChange={(e) => setTicketMonth(Number(e.target.value))}
          className="bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
        >
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={ticketYear}
          onChange={(e) => setTicketYear(Number(e.target.value))}
          className="bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  </div>

  <div className="p-4 sm:p-6">
    {ticketLoading ? (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f6b100] mx-auto" />
      </div>
    ) : ticketData ? (
      <>
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-[#262626] rounded-lg p-3 sm:p-4 border border-[#343434] text-center">
            <p className="text-[#ababab] text-xs uppercase tracking-wide mb-1">Tickets</p>
            <p className="text-[#f5f5f5] text-xl sm:text-2xl font-bold">{ticketData.monthlyCount}</p>
          </div>
          <div className="bg-[#262626] rounded-lg p-3 sm:p-4 border border-[#343434] text-center">
            <p className="text-[#ababab] text-xs uppercase tracking-wide mb-1">Score</p>
            <p className="text-[#f6b100] text-xl sm:text-2xl font-bold">{ticketData.monthlyScore}</p>
          </div>
          <div className="bg-[#262626] rounded-lg p-3 sm:p-4 border border-[#343434] text-center">
            <p className="text-[#ababab] text-xs uppercase tracking-wide mb-1">All-Time</p>
            <p className="text-[#10B981] text-xl sm:text-2xl font-bold">{ticketData.allTimeScore}</p>
          </div>
        </div>

        {/* Ticket list toggle */}
        {ticketData.tickets && ticketData.tickets.length > 0 && (
          <div className="bg-[#262626]/30 rounded-lg sm:rounded-xl border border-[#3a3a3a] overflow-hidden">
            <button
              onClick={() => setShowTicketList(!showTicketList)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#262626]/50 hover:bg-[#2a2a2a] transition-all"
            >
              <div className="flex items-center gap-2">
                <MdStar size={16} className={showTicketList ? "text-[#f6b100]" : "text-[#ababab]"} />
                <span className="text-[#f5f5f5] font-semibold text-sm">
                  Tickets this month ({ticketData.tickets.length})
                </span>
              </div>
              <span className={`text-[#ababab] font-bold text-xs transition-transform ${showTicketList ? "rotate-180" : ""}`}>▼</span>
            </button>
            {showTicketList && (
              <div className="p-3 space-y-2">
                {ticketData.tickets.map((t) => (
                  <div key={t._id} className="flex items-start justify-between gap-3 p-3 bg-[#1f1f1f] rounded-lg border border-[#343434]">
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f5f5f5] text-sm font-medium truncate">{t.title}</p>
                      {t.note && <p className="text-[#ababab] text-xs mt-0.5 truncate">{t.note}</p>}
                      <p className="text-[#6a6a6a] text-xs mt-1">
                        {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 bg-[#f6b100]/15 text-[#f6b100] px-2 py-1 rounded text-sm font-bold whitespace-nowrap flex-shrink-0">
                      <MdStar size={12} /> {t.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {ticketData.tickets?.length === 0 && (
          <div className="text-center py-8 bg-[#262626]/30 rounded-lg border border-dashed border-[#3a3a3a]">
            <MdStar size={32} className="mx-auto text-[#3a3a3a] mb-2" />
            <p className="text-[#ababab] text-sm">No tickets for this month</p>
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-8">
        <p className="text-[#ababab] text-sm">Unable to load ticket data</p>
      </div>
    )}
  </div>
</div>
```

Also add `MdStar` to the import at the top of AccountSettings.jsx (it imports from `react-icons/md`):

```jsx
import { MdPerson, MdEmail, MdPhone, MdLock, MdSave, MdVisibility, MdVisibilityOff, MdAttachMoney, MdCalendarToday, MdAccessTime, MdCheckCircle, MdCancel, MdStar } from "react-icons/md";
```

- [ ] **Step 4: Commit**

```bash
git add pos-frontend/src/pages/AccountSettings.jsx
git commit -m "feat: add My Tickets section to AccountSettings"
```

---

## Self-Review Checklist

- [x] Ticket model with all required fields, validation, and indexes — Task 1
- [x] All 6 API endpoints (getTickets, createTicket, updateTicket, deleteTicket, getSummary, getMyTickets) — Task 2 & 3
- [x] Member-to-store validation on createTicket — Task 2
- [x] Cross-store access guard on updateTicket/deleteTicket — Task 2
- [x] Route registered in app.ts — Task 3
- [x] `isStoreRole("Owner","Manager")` on management routes — Task 3
- [x] Any store member can call `/my-tickets` — Task 3
- [x] Frontend API helpers mirror all 6 endpoints — Task 4
- [x] Redux slice covers all operations + loading/error states — Task 5
- [x] TicketModal handles create (with member select) and edit (without member select) — Task 6
- [x] Tickets page shows summary cards, leaderboard, ticket list — Task 7
- [x] ROUTES.TICKETS constant, PROTECTED_ROUTES entry, COMPONENT_MAP, pages/index export — Task 7
- [x] Sidebar Tickets link under Admin section — Task 7
- [x] AccountSettings My Tickets section with month/year pickers, 3 cards, collapsible list — Task 8
- [x] MdStar added to AccountSettings icon imports — Task 8
