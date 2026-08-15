# Member Monthly Salary Across All Assigned Stores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Account Settings Monthly Salary and My Tickets show combined totals plus a per-store breakdown for every store the logged-in member is assigned to, including ticket count and ticket points.

**Architecture:** Extract `pickAssignedStores` and `buildMemberMonthlySalary` as pure helpers. Widen `GET /api/salary/:year/:month` and `GET /api/ticket/my-tickets` so they query active `StoreUser` rows instead of `req.store._id`. Account Settings keeps the same API helpers and adds ticket cards, a By store list, and store names on detail rows.

**Tech Stack:** Node.js + Express + TypeScript + Mongoose + Jest (backend); React 18 + Vite + Tailwind CSS (frontend).

**Spec:** `docs/superpowers/specs/2026-08-15-member-salary-all-stores-design.md`

## Global Constraints

- Same URLs: `GET /api/salary/:year/:month` and `GET /api/ticket/my-tickets`
- Keep `isVerifiedUser` + `storeContext` (header store required for session, not used as a data filter)
- Store list comes from `StoreUser.find({ user: req.user._id, isActive: true })`; skip missing or inactive stores
- Admin with no StoreUser rows falls back to `req.store`; non-admin members never get that fallback
- Hourly rate is the single `User.salary` field, same at every store
- Member sees only `req.user._id` data
- `stores[]` includes every assigned store, including zeros, sorted by store name
- Combined `summary` totals equal the sum of matching `stores[].summary` fields
- No TypeScript `any` in `pos-backend/`
- Do not change admin `GET /api/salary/summary/all` or the Tickets leaderboard page

## File Map

**Create:**
- `pos-backend/utils/assignedStores.ts` — resolve assigned stores from StoreUser rows
- `pos-backend/utils/memberMonthlySalary.ts` — build the member monthly salary payload
- `pos-backend/tests/assignedStores.test.ts`
- `pos-backend/tests/memberMonthlySalary.test.ts`

**Modify:**
- `pos-backend/types/salary.ts` — member monthly salary types
- `pos-backend/controllers/salaryController.ts` — `getMonthlySalary` uses helpers
- `pos-backend/controllers/ticketController.ts` — `getMyTickets` uses assigned stores
- `pos-frontend/src/pages/AccountSettings.jsx` — ticket cards, By store, store names

---

### Task 1: Assigned store helper

**Files:**
- Create: `pos-backend/utils/assignedStores.ts`
- Create: `pos-backend/tests/assignedStores.test.ts`
- Modify: `pos-backend/types/salary.ts`

**Interfaces:**
- Consumes: StoreUser-shaped rows and an optional fallback store
- Produces: `pickAssignedStores(rows, options) => AssignedStoreInfo[]` where `AssignedStoreInfo` is `{ id: string; name: string; code: string }`

- [ ] **Step 1: Add `AssignedStoreInfo` to salary types**

Append to `pos-backend/types/salary.ts`:

```ts
/** Store identity used on the member monthly salary payload. */
export interface AssignedStoreInfo {
  id: string;
  name: string;
  code: string;
}

/** Combined month totals for the logged-in member across assigned stores. */
export interface MemberMonthlySalarySummary {
  totalShifts: number;
  regularHours: number;
  extraWorkHours: number;
  totalHours: number;
  hourlyRate: number;
  regularSalary: number;
  extraWorkPayment: number;
  totalSalary: number;
  totalTickets: number;
  totalTicketScore: number;
}

/** One assigned store row on the member monthly salary payload. */
export interface MemberStoreSalaryBlock {
  store: AssignedStoreInfo;
  summary: MemberMonthlySalarySummary;
}

/** One shift row on the member monthly salary payload. */
export interface MemberSalaryShiftDetail {
  date: Date | string;
  shiftName: string;
  startTime: string;
  endTime: string;
  hours: number;
  status: string;
  color?: string;
  storeId: string;
  storeName: string;
}

/** One extra work row on the member monthly salary payload. */
export interface MemberSalaryExtraWorkDetail {
  date: Date | string;
  durationHours: number;
  workType: string;
  description: string;
  hourlyRate: number;
  paymentAmount: number;
  isApproved: boolean;
  isPaid: boolean;
  storeId: string;
  storeName: string;
}
```

- [ ] **Step 2: Write the failing tests**

Create `pos-backend/tests/assignedStores.test.ts`:

```ts
import { describe, expect, it } from "@jest/globals";
import { pickAssignedStores } from "../utils/assignedStores.js";

const storeA = { _id: "aaa", name: "Alpha", code: "A", isActive: true };
const storeB = { _id: "bbb", name: "Beta", code: "B", isActive: true };
const inactiveStore = { _id: "ccc", name: "Closed", code: "C", isActive: false };

describe("pickAssignedStores", () => {
  it("returns active assignments with active stores, sorted by name", () => {
    const result = pickAssignedStores(
      [
        { isActive: true, store: storeB },
        { isActive: true, store: storeA }
      ],
      { isAdmin: false }
    );

    expect(result.map((s) => s.name)).toEqual(["Alpha", "Beta"]);
    expect(result[0]).toEqual({ id: "aaa", name: "Alpha", code: "A" });
  });

  it("skips inactive assignments, inactive stores, and missing stores", () => {
    const result = pickAssignedStores(
      [
        { isActive: false, store: storeA },
        { isActive: true, store: inactiveStore },
        { isActive: true, store: null }
      ],
      { isAdmin: false }
    );

    expect(result).toEqual([]);
  });

  it("returns empty for a non-admin with no assignments", () => {
    const result = pickAssignedStores([], {
      isAdmin: false,
      fallbackStore: storeA
    });
    expect(result).toEqual([]);
  });

  it("falls back to the current store for an admin with no assignments", () => {
    const result = pickAssignedStores([], {
      isAdmin: true,
      fallbackStore: storeA
    });
    expect(result).toEqual([{ id: "aaa", name: "Alpha", code: "A" }]);
  });

  it("does not use the fallback when the admin already has assignments", () => {
    const result = pickAssignedStores(
      [{ isActive: true, store: storeB }],
      { isAdmin: true, fallbackStore: storeA }
    );
    expect(result).toEqual([{ id: "bbb", name: "Beta", code: "B" }]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd pos-backend && npm test -- --testPathPatterns=assignedStores`

Expected: FAIL with `Cannot find module '../utils/assignedStores.js'`

- [ ] **Step 4: Write the helper**

Create `pos-backend/utils/assignedStores.ts`:

```ts
import type { AssignedStoreInfo } from "../types/salary.js";

type StoreLike = {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  code?: unknown;
  isActive?: unknown;
} | null | undefined;

type AssignmentLike = {
  isActive?: unknown;
  store?: StoreLike;
};

export type PickAssignedStoresOptions = {
  isAdmin: boolean;
  fallbackStore?: StoreLike;
};

function toStoreInfo(store: StoreLike): AssignedStoreInfo | null {
  if (!store || typeof store !== "object") {
    return null;
  }

  const idValue = store._id ?? store.id;
  if (idValue === undefined || idValue === null) {
    return null;
  }

  return {
    id: String(idValue),
    name: String(store.name ?? ""),
    code: String(store.code ?? "")
  };
}

export function pickAssignedStores(
  rows: AssignmentLike[],
  options: PickAssignedStoresOptions
): AssignedStoreInfo[] {
  const stores: AssignedStoreInfo[] = [];

  for (const row of rows) {
    if (row.isActive === false) {
      continue;
    }

    const store = row.store;
    if (!store || store.isActive === false) {
      continue;
    }

    const info = toStoreInfo(store);
    if (info) {
      stores.push(info);
    }
  }

  stores.sort((a, b) => a.name.localeCompare(b.name));

  if (stores.length === 0 && options.isAdmin) {
    const fallback = toStoreInfo(options.fallbackStore);
    if (fallback) {
      return [fallback];
    }
  }

  return stores;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd pos-backend && npm test -- --testPathPatterns=assignedStores`

Expected: PASS, 5 tests

- [ ] **Step 6: Commit**

```bash
git add pos-backend/types/salary.ts pos-backend/utils/assignedStores.ts pos-backend/tests/assignedStores.test.ts
git commit -m "feat(salary): resolve member assigned stores for monthly view"
```

---

### Task 2: Member monthly salary builder

**Files:**
- Create: `pos-backend/utils/memberMonthlySalary.ts`
- Create: `pos-backend/tests/memberMonthlySalary.test.ts`

**Interfaces:**
- Consumes: `AssignedStoreInfo[]` from Task 1; schedule, extra work, and ticket records
- Produces: `buildMemberMonthlySalary(input) => { member, period, summary, stores, shifts, extraWork }`

- [ ] **Step 1: Write the failing tests**

Create `pos-backend/tests/memberMonthlySalary.test.ts`:

```ts
import { describe, expect, it } from "@jest/globals";
import { buildMemberMonthlySalary } from "../utils/memberMonthlySalary.js";

const stores = [
  { id: "s1", name: "Store One", code: "S1" },
  { id: "s2", name: "Store Two", code: "S2" }
];

const member = { _id: "m1", name: "Ada", role: "User", salary: 10 };

const morning = {
  name: "Morning",
  startTime: "08:00",
  endTime: "16:00",
  durationHours: 8,
  color: "#4ECDC4"
};

describe("buildMemberMonthlySalary", () => {
  it("sums two stores and keeps a zero-activity store", () => {
    const result = buildMemberMonthlySalary({
      member,
      year: 2026,
      month: 8,
      assignedStores: stores,
      schedules: [
        {
          store: "s1",
          date: new Date("2026-08-02"),
          shiftTemplate: morning,
          assignedMembers: [{ member: "m1", status: "completed" }]
        }
      ],
      extraWork: [
        {
          store: "s1",
          date: new Date("2026-08-03"),
          durationHours: 2,
          workType: "overtime",
          description: "Close",
          hourlyRate: 10,
          paymentAmount: 20,
          isApproved: true,
          isPaid: false
        }
      ],
      tickets: [
        { store: "s1", score: 5 },
        { store: "s2", score: 3 }
      ]
    });

    expect(result.summary.totalShifts).toBe(1);
    expect(result.summary.regularHours).toBe(8);
    expect(result.summary.extraWorkHours).toBe(2);
    expect(result.summary.totalHours).toBe(10);
    expect(result.summary.regularSalary).toBe(80);
    expect(result.summary.extraWorkPayment).toBe(20);
    expect(result.summary.totalSalary).toBe(100);
    expect(result.summary.totalTickets).toBe(2);
    expect(result.summary.totalTicketScore).toBe(8);

    expect(result.stores).toHaveLength(2);
    expect(result.stores[0].store.name).toBe("Store One");
    expect(result.stores[0].summary.totalSalary).toBe(100);
    expect(result.stores[0].summary.totalTickets).toBe(1);
    expect(result.stores[0].summary.totalTicketScore).toBe(5);
    expect(result.stores[1].summary.totalSalary).toBe(0);
    expect(result.stores[1].summary.totalTickets).toBe(1);
    expect(result.stores[1].summary.totalTicketScore).toBe(3);

    expect(result.summary.totalSalary).toBe(
      result.stores[0].summary.totalSalary + result.stores[1].summary.totalSalary
    );
    expect(result.summary.totalTicketScore).toBe(
      result.stores[0].summary.totalTicketScore + result.stores[1].summary.totalTicketScore
    );

    expect(result.shifts[0].storeName).toBe("Store One");
    expect(result.extraWork[0].storeName).toBe("Store One");
  });

  it("ignores absent shifts and tickets at stores the member is not assigned to", () => {
    const result = buildMemberMonthlySalary({
      member,
      year: 2026,
      month: 8,
      assignedStores: [stores[0]],
      schedules: [
        {
          store: "s1",
          date: new Date("2026-08-02"),
          shiftTemplate: morning,
          assignedMembers: [{ member: "m1", status: "absent" }]
        }
      ],
      extraWork: [],
      tickets: [{ store: "s9", score: 99 }]
    });

    expect(result.summary.totalShifts).toBe(0);
    expect(result.summary.totalSalary).toBe(0);
    expect(result.summary.totalTickets).toBe(0);
    expect(result.summary.totalTicketScore).toBe(0);
    expect(result.shifts).toEqual([]);
  });

  it("returns empty lists and zero totals when there are no assigned stores", () => {
    const result = buildMemberMonthlySalary({
      member,
      year: 2026,
      month: 8,
      assignedStores: [],
      schedules: [],
      extraWork: [],
      tickets: []
    });

    expect(result.stores).toEqual([]);
    expect(result.shifts).toEqual([]);
    expect(result.extraWork).toEqual([]);
    expect(result.summary.totalSalary).toBe(0);
    expect(result.summary.totalTickets).toBe(0);
    expect(result.period.monthName).toBe("August");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pos-backend && npm test -- --testPathPatterns=memberMonthlySalary`

Expected: FAIL with `Cannot find module '../utils/memberMonthlySalary.js'`

- [ ] **Step 3: Write the builder**

Create `pos-backend/utils/memberMonthlySalary.ts`:

```ts
import type {
  AssignedStoreInfo,
  MemberMonthlySalarySummary,
  MemberSalaryExtraWorkDetail,
  MemberSalaryShiftDetail,
  MemberStoreSalaryBlock
} from "../types/salary.js";

const VALID_STATUSES = ["scheduled", "confirmed", "completed"];

type MemberLike = {
  _id: unknown;
  name: unknown;
  role: unknown;
  salary?: number;
};

type ScheduleLike = {
  store: unknown;
  date: Date | string;
  shiftTemplate?: {
    name?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    color?: string;
  } | null;
  assignedMembers?: Array<{ member: unknown; status?: string }>;
};

type ExtraWorkLike = {
  store: unknown;
  date: Date | string;
  durationHours?: number;
  workType?: string;
  description?: string;
  hourlyRate?: number;
  paymentAmount?: number;
  isApproved?: boolean;
  isPaid?: boolean;
};

type TicketLike = {
  store: unknown;
  score?: number;
};

export type BuildMemberMonthlySalaryInput = {
  member: MemberLike;
  year: number;
  month: number;
  assignedStores: AssignedStoreInfo[];
  schedules: ScheduleLike[];
  extraWork: ExtraWorkLike[];
  tickets: TicketLike[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function idOf(value: unknown): string {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function memberIdOf(value: unknown): string {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

type StoreAcc = {
  totalShifts: number;
  regularHours: number;
  extraWorkHours: number;
  extraWorkPayment: number;
  totalTickets: number;
  totalTicketScore: number;
};

function emptyAcc(): StoreAcc {
  return {
    totalShifts: 0,
    regularHours: 0,
    extraWorkHours: 0,
    extraWorkPayment: 0,
    totalTickets: 0,
    totalTicketScore: 0
  };
}

function toSummary(acc: StoreAcc, hourlyRate: number): MemberMonthlySalarySummary {
  const regularSalary = acc.regularHours * hourlyRate;
  return {
    totalShifts: acc.totalShifts,
    regularHours: roundMoney(acc.regularHours),
    extraWorkHours: roundMoney(acc.extraWorkHours),
    totalHours: roundMoney(acc.regularHours + acc.extraWorkHours),
    hourlyRate,
    regularSalary: roundMoney(regularSalary),
    extraWorkPayment: roundMoney(acc.extraWorkPayment),
    totalSalary: roundMoney(regularSalary + acc.extraWorkPayment),
    totalTickets: acc.totalTickets,
    totalTicketScore: acc.totalTicketScore
  };
}

export function buildMemberMonthlySalary(input: BuildMemberMonthlySalaryInput) {
  const { member, year, month, assignedStores, schedules, extraWork, tickets } = input;
  const hourlyRate = member.salary || 0;
  const memberId = String(member._id);
  const storeById = new Map(assignedStores.map((store) => [store.id, store]));
  const perStore = new Map<string, StoreAcc>(
    assignedStores.map((store) => [store.id, emptyAcc()])
  );

  const shifts: MemberSalaryShiftDetail[] = [];
  for (const schedule of schedules) {
    const storeId = idOf(schedule.store);
    const acc = perStore.get(storeId);
    if (!acc) {
      continue;
    }

    const memberAssignment = (schedule.assignedMembers || []).find((assignment) => {
      return memberIdOf(assignment.member) === memberId;
    });

    if (
      !memberAssignment ||
      !schedule.shiftTemplate ||
      !VALID_STATUSES.includes(memberAssignment.status || "")
    ) {
      continue;
    }

    const hours = schedule.shiftTemplate.durationHours || 0;
    acc.totalShifts += 1;
    acc.regularHours += hours;
    shifts.push({
      date: schedule.date,
      shiftName: schedule.shiftTemplate.name || "",
      startTime: schedule.shiftTemplate.startTime || "",
      endTime: schedule.shiftTemplate.endTime || "",
      hours,
      status: memberAssignment.status || "",
      color: schedule.shiftTemplate.color,
      storeId,
      storeName: storeById.get(storeId)?.name || ""
    });
  }

  const extraWorkDetails: MemberSalaryExtraWorkDetail[] = [];
  for (const entry of extraWork) {
    const storeId = idOf(entry.store);
    const acc = perStore.get(storeId);
    if (!acc) {
      continue;
    }

    acc.extraWorkHours += entry.durationHours || 0;
    acc.extraWorkPayment += entry.paymentAmount || 0;
    extraWorkDetails.push({
      date: entry.date,
      durationHours: entry.durationHours || 0,
      workType: entry.workType || "",
      description: entry.description || "",
      hourlyRate: entry.hourlyRate || 0,
      paymentAmount: entry.paymentAmount || 0,
      isApproved: Boolean(entry.isApproved),
      isPaid: Boolean(entry.isPaid),
      storeId,
      storeName: storeById.get(storeId)?.name || ""
    });
  }

  for (const ticket of tickets) {
    const storeId = idOf(ticket.store);
    const acc = perStore.get(storeId);
    if (!acc) {
      continue;
    }
    acc.totalTickets += 1;
    acc.totalTicketScore += ticket.score || 0;
  }

  const storeBlocks: MemberStoreSalaryBlock[] = assignedStores.map((store) => ({
    store,
    summary: toSummary(perStore.get(store.id) || emptyAcc(), hourlyRate)
  }));

  const combined: MemberMonthlySalarySummary = {
    totalShifts: 0,
    regularHours: 0,
    extraWorkHours: 0,
    totalHours: 0,
    hourlyRate,
    regularSalary: 0,
    extraWorkPayment: 0,
    totalSalary: 0,
    totalTickets: 0,
    totalTicketScore: 0
  };

  for (const block of storeBlocks) {
    combined.totalShifts += block.summary.totalShifts;
    combined.regularHours += block.summary.regularHours;
    combined.extraWorkHours += block.summary.extraWorkHours;
    combined.totalHours += block.summary.totalHours;
    combined.regularSalary += block.summary.regularSalary;
    combined.extraWorkPayment += block.summary.extraWorkPayment;
    combined.totalSalary += block.summary.totalSalary;
    combined.totalTickets += block.summary.totalTickets;
    combined.totalTicketScore += block.summary.totalTicketScore;
  }

  return {
    member: {
      id: member._id,
      name: member.name,
      role: member.role,
      hourlyRate
    },
    period: {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString("en-US", { month: "long" })
    },
    summary: {
      totalShifts: combined.totalShifts,
      regularHours: roundMoney(combined.regularHours),
      extraWorkHours: roundMoney(combined.extraWorkHours),
      totalHours: roundMoney(combined.totalHours),
      hourlyRate,
      regularSalary: roundMoney(combined.regularSalary),
      extraWorkPayment: roundMoney(combined.extraWorkPayment),
      totalSalary: roundMoney(combined.totalSalary),
      totalTickets: combined.totalTickets,
      totalTicketScore: combined.totalTicketScore
    },
    stores: storeBlocks,
    shifts,
    extraWork: extraWorkDetails
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd pos-backend && npm test -- --testPathPatterns=memberMonthlySalary`

Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add pos-backend/utils/memberMonthlySalary.ts pos-backend/tests/memberMonthlySalary.test.ts
git commit -m "feat(salary): build member monthly totals across assigned stores"
```

---

### Task 3: Widen `getMonthlySalary`

**Files:**
- Modify: `pos-backend/controllers/salaryController.ts`

**Interfaces:**
- Consumes: `pickAssignedStores` from Task 1, `buildMemberMonthlySalary` from Task 2
- Produces: `GET /api/salary/:year/:month` response `{ success, data }` matching the spec (`summary.totalTickets`, `summary.totalTicketScore`, `stores[]`, store-tagged `shifts` and `extraWork`)

- [ ] **Step 1: Replace `getMonthlySalary`**

Keep `getAllMembersSalarySummary` unchanged. Replace only `getMonthlySalary` and add the new imports at the top of `pos-backend/controllers/salaryController.ts`:

```ts
import { userRoles } from "../constants/user.js";
import { pickAssignedStores } from "../utils/assignedStores.js";
import { buildMemberMonthlySalary } from "../utils/memberMonthlySalary.js";
```

Replace the existing `getMonthlySalary` function with:

```ts
const getMonthlySalary = async (req, res, next) => {
    try {
        const { year, month } = req.params;
        const memberId = req.user._id;

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
            const error = createHttpError(400, "Invalid year or month!");
            return next(error);
        }

        const member = await User.findById(memberId).select("salary name role");
        if (!member) {
            const error = createHttpError(404, "Member not found!");
            return next(error);
        }

        const assignments = await StoreUser.find({
            user: memberId,
            isActive: true
        })
            .populate("store", "name code isActive")
            .lean();

        const assignedStores = pickAssignedStores(assignments, {
            isAdmin: req.user.role === userRoles.ADMIN,
            fallbackStore: req.store
        });
        const assignedStoreIds = assignedStores.map((store) => store.id);

        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        const [schedules, extraWorkEntries, tickets] = assignedStoreIds.length > 0
            ? await Promise.all([
                Schedule.find({
                    store: { $in: assignedStoreIds },
                    "assignedMembers.member": memberId,
                    date: { $gte: startDate, $lte: endDate }
                })
                    .populate("shiftTemplate", "name shortName startTime endTime durationHours color")
                    .populate("assignedMembers.member", "name")
                    .sort({ date: 1 })
                    .lean(),
                ExtraWork.find({
                    store: { $in: assignedStoreIds },
                    member: memberId,
                    date: { $gte: startDate, $lte: endDate }
                })
                    .sort({ date: 1 })
                    .lean(),
                Ticket.find({
                    store: { $in: assignedStoreIds },
                    member: memberId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }).lean()
            ])
            : [[], [], []];

        const data = buildMemberMonthlySalary({
            member,
            year: yearNum,
            month: monthNum,
            assignedStores,
            schedules,
            extraWork: extraWorkEntries,
            tickets
        });

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
};
```

- [ ] **Step 2: Re-run helper tests and typecheck**

Run:

```bash
cd pos-backend && npm test -- --testPathPatterns='assignedStores|memberMonthlySalary'
cd pos-backend && npx tsc --noEmit
```

Expected: tests PASS; `tsc` exits 0. `getAllMembersSalarySummary` still compiles.

- [ ] **Step 3: Commit**

```bash
git add pos-backend/controllers/salaryController.ts
git commit -m "feat(salary): load member monthly salary from all assigned stores"
```

---

### Task 4: Widen `getMyTickets`

**Files:**
- Modify: `pos-backend/controllers/ticketController.ts`

**Interfaces:**
- Consumes: `pickAssignedStores` from Task 1
- Produces: `GET /api/ticket/my-tickets` with monthly and all-time totals across assigned stores; each ticket populated as `store: { _id, name }`

- [ ] **Step 1: Update `getMyTickets`**

Add imports at the top of `pos-backend/controllers/ticketController.ts` if missing:

```ts
import { userRoles } from "../constants/user.js";
import { pickAssignedStores } from "../utils/assignedStores.js";
```

`StoreUser` is already imported in this file. Replace `getMyTickets` with:

```ts
const getMyTickets = async (req, res, next) => {
    try {
        const memberId = req.user._id;
        const now = new Date();
        const targetMonth = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
        const targetYear = parseInt(req.query.year as string, 10) || now.getFullYear();

        const assignments = await StoreUser.find({
            user: memberId,
            isActive: true
        })
            .populate("store", "name code isActive")
            .lean();

        const assignedStores = pickAssignedStores(assignments, {
            isAdmin: req.user.role === userRoles.ADMIN,
            fallbackStore: req.store
        });
        const assignedStoreIds = assignedStores.map((store) => store.id);

        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        const monthEnd = new Date(targetYear, targetMonth, 1);

        if (assignedStoreIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    month: targetMonth,
                    year: targetYear,
                    monthlyScore: 0,
                    monthlyCount: 0,
                    allTimeScore: 0,
                    allTimeCount: 0,
                    tickets: []
                }
            });
        }

        const [monthlyTickets, allTimeAgg] = await Promise.all([
            Ticket.find({
                store: { $in: assignedStoreIds },
                member: memberId,
                createdAt: { $gte: monthStart, $lt: monthEnd }
            })
                .populate("store", "name")
                .sort({ createdAt: -1 })
                .lean(),
            Ticket.aggregate([
                { $match: { store: { $in: assignedStoreIds }, member: memberId } },
                { $group: { _id: null, allTimeScore: { $sum: "$score" }, allTimeCount: { $sum: 1 } } }
            ])
        ]);

        const monthlyScore = monthlyTickets.reduce((sum, ticket) => sum + ticket.score, 0);
        const allTimeScore = allTimeAgg[0]?.allTimeScore || 0;
        const allTimeCount = allTimeAgg[0]?.allTimeCount || 0;

        res.status(200).json({
            success: true,
            data: {
                month: targetMonth,
                year: targetYear,
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
```

- [ ] **Step 2: Typecheck**

Run: `cd pos-backend && npx tsc --noEmit`

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add pos-backend/controllers/ticketController.ts
git commit -m "feat(tickets): load my tickets from all assigned stores"
```

---

### Task 5: Account Settings UI

**Files:**
- Modify: `pos-frontend/src/pages/AccountSettings.jsx`

**Interfaces:**
- Consumes: widened `getMonthlySalary` and `getMyTickets` payloads from Tasks 3 and 4
- Produces: ticket cards, By store list, store names on shift / extra work / ticket rows

- [ ] **Step 1: Update the Monthly Salary subtitle**

Replace:

```jsx
<p className="text-[#ababab] text-xs sm:text-sm mt-1 sm:mt-2 ml-0 sm:ml-14">Track your earnings based on shifts worked</p>
```

with:

```jsx
<p className="text-[#ababab] text-xs sm:text-sm mt-1 sm:mt-2 ml-0 sm:ml-14">Earnings and tickets across every assigned store</p>
```

- [ ] **Step 2: Add ticket cards after the Total Salary card**

Change the summary grid class from `lg:grid-cols-4` to `lg:grid-cols-3`. Immediately after the Total Salary card `</div>` (the highlighted card), before the grid closes, insert:

```jsx
                  <div className="bg-gradient-to-br from-[#262626] to-[#1f1f1f] rounded-lg sm:rounded-xl p-3 sm:p-5 border border-[#3a3a3a] hover:border-brand/50 transition-all">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-[#ababab] text-[10px] sm:text-xs font-medium uppercase tracking-wide">Tickets</p>
                      <MdStar className="text-[#6a6a6a] w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <p className="text-[#f5f5f5] text-base sm:text-lg font-bold">{salaryData.summary.totalTickets || 0}</p>
                    <p className="text-[#6a6a6a] text-[10px] sm:text-xs mt-1 sm:mt-2">this month</p>
                  </div>

                  <div className="bg-gradient-to-br from-[#262626] to-[#1f1f1f] rounded-lg sm:rounded-xl p-3 sm:p-5 border border-[#3a3a3a] hover:border-brand/50 transition-all">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-[#ababab] text-[10px] sm:text-xs font-medium uppercase tracking-wide">Ticket Points</p>
                      <MdStar className="text-brand w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <p className="text-brand text-base sm:text-lg font-bold">{salaryData.summary.totalTicketScore || 0}</p>
                    <p className="text-[#6a6a6a] text-[10px] sm:text-xs mt-1 sm:mt-2">this month</p>
                  </div>
```

`MdStar` is already imported.

- [ ] **Step 3: Add the By store list after the summary grid**

Insert this block after the summary cards `</div>` and before the Shift Details toggle:

```jsx
                {salaryData.stores && salaryData.stores.length > 0 && (
                  <div className="bg-[#262626]/30 rounded-lg sm:rounded-xl border border-[#3a3a3a] overflow-hidden">
                    <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-[#3a3a3a]">
                      <p className="text-[#f5f5f5] font-semibold text-sm sm:text-base">By store</p>
                      <p className="text-[#ababab] text-[10px] sm:text-xs mt-0.5">Every store you are assigned to this month</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead>
                          <tr className="border-b border-[#343434]">
                            <th className="px-3 sm:px-4 py-2 text-left text-[#ababab] text-[10px] sm:text-xs font-medium">Store</th>
                            <th className="px-3 sm:px-4 py-2 text-right text-[#ababab] text-[10px] sm:text-xs font-medium">Shifts</th>
                            <th className="px-3 sm:px-4 py-2 text-right text-[#ababab] text-[10px] sm:text-xs font-medium">Hours</th>
                            <th className="px-3 sm:px-4 py-2 text-right text-[#ababab] text-[10px] sm:text-xs font-medium">Pay</th>
                            <th className="px-3 sm:px-4 py-2 text-right text-[#ababab] text-[10px] sm:text-xs font-medium">Tickets</th>
                            <th className="px-3 sm:px-4 py-2 text-right text-[#ababab] text-[10px] sm:text-xs font-medium">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salaryData.stores.map((row) => (
                            <tr key={row.store.id} className="border-b border-[#343434] last:border-0">
                              <td className="px-3 sm:px-4 py-2.5 text-[#f5f5f5] text-xs sm:text-sm font-medium">{row.store.name}</td>
                              <td className="px-3 sm:px-4 py-2.5 text-[#f5f5f5] text-xs sm:text-sm text-right">{row.summary.totalShifts}</td>
                              <td className="px-3 sm:px-4 py-2.5 text-brand text-xs sm:text-sm text-right">{row.summary.totalHours}h</td>
                              <td className="px-3 sm:px-4 py-2.5 text-[#4ECDC4] text-xs sm:text-sm text-right">
                                {row.summary.totalSalary?.toLocaleString ? row.summary.totalSalary.toLocaleString("en-US") : row.summary.totalSalary}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-[#f5f5f5] text-xs sm:text-sm text-right">{row.summary.totalTickets}</td>
                              <td className="px-3 sm:px-4 py-2.5 text-brand text-xs sm:text-sm text-right">{row.summary.totalTicketScore}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
```

- [ ] **Step 4: Show store name on shift, extra work, and ticket rows**

On each shift card, under `{shift.shiftName}`, add:

```jsx
                                  {shift.storeName ? (
                                    <span className="text-[#6a6a6a]"> · {shift.storeName}</span>
                                  ) : null}
```

In the extra work table, add a Store column after Date. Header:

```jsx
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[#ababab] text-[10px] sm:text-xs font-medium">Store</th>
```

Cell:

```jsx
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-[#ababab] text-xs sm:text-sm">
                                      {entry.storeName || "-"}
                                    </td>
```

Update the empty-month copy from `No shifts assigned for this month` / `Your salary will be calculated once shifts are assigned to you by the administrator` to:

```jsx
                    <p className="text-[#ababab] text-sm sm:text-lg font-medium">No activity at any assigned store this month</p>
                    <p className="text-[#6a6a6a] text-xs sm:text-sm mt-2 max-w-md mx-auto px-4">
                      Your salary and tickets will show here once shifts or tickets are recorded
                    </p>
```

Keep showing this empty message only when there are no shifts and no extra work. The By store list still renders above it when `stores` is present.

On each My Tickets row, replace the date-only line with:

```jsx
                              <p className="text-[#ababab] text-xs mt-0.5">
                                {new Date(t.createdAt).toLocaleDateString()}
                                {t.store?.name ? ` · ${t.store.name}` : ""}
                              </p>
```

- [ ] **Step 5: Lint the page**

Run: `cd pos-frontend && npx eslint src/pages/AccountSettings.jsx`

Expected: no new errors

- [ ] **Step 6: Commit**

```bash
git add pos-frontend/src/pages/AccountSettings.jsx
git commit -m "feat(account): show all-store salary and ticket points"
```

---

### Task 6: Verify against the spec

**Files:**
- None (read-only checks)

- [ ] **Step 1: Run backend unit tests**

Run: `cd pos-backend && npm test -- --testPathPatterns='assignedStores|memberMonthlySalary'`

Expected: PASS

- [ ] **Step 2: Manual Account Settings check**

Log in as a member assigned to two stores. Open Account Settings.

1. Combined pay and ticket points equal the sum of the By store rows.
2. A store with no activity that month still appears as zeros.
3. Shift, extra work, and ticket rows show the correct store name.
4. Changing month reloads both sections.
5. Header store change does not hide the other assigned store.

- [ ] **Step 3: Commit only if Step 2 required a fix**

If a fix was needed, commit that fix with a message that says what was wrong. If nothing changed, do not create an empty commit.

---

## Self-review

**Spec coverage**
1. Combined pay across assigned stores — Tasks 2, 3, 5
2. Combined ticket count and points in Monthly Salary — Tasks 2, 3, 5
3. By store list including zeros — Tasks 2, 5
4. Store names on shift and extra work rows — Tasks 2, 5
5. My Tickets all-store totals and store names — Tasks 4, 5
6. Own data only — Tasks 3, 4 (`req.user._id` + assigned stores)
7. Single hourly rate — Task 2 (`member.salary`)
8. Header store required, not a filter — Tasks 3, 4
9. Admin fallback — Task 1
10. Out of scope items left untouched — Task 3 leaves `getAllMembersSalarySummary` as is

**Placeholder scan:** none

**Type consistency:** `AssignedStoreInfo`, `MemberMonthlySalarySummary`, `pickAssignedStores`, and `buildMemberMonthlySalary` names match across Tasks 1–4
