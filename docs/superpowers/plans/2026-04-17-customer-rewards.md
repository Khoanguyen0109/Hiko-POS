# Customer Rewards System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a configurable customer loyalty rewards system where dishes are tracked per customer across all stores, with admin management and analytics dashboard.

**Architecture:** Dedicated RewardService handles all reward logic (earn, redeem, deduct, restore). New RewardProgram and RewardLog Mongoose models provide configuration and audit trail. Customer model is migrated from store-scoped to global. Frontend adds customer lookup to the ordering flow and new admin pages.

**Tech Stack:** MongoDB/Mongoose, Express, React 18, Redux Toolkit, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-17-customer-rewards-design.md`

---

## File Structure

### Backend — New Files
- `pos-backend/models/rewardProgramModel.ts` — RewardProgram schema
- `pos-backend/models/rewardLogModel.ts` — RewardLog schema
- `pos-backend/services/rewardService.ts` — Core reward logic
- `pos-backend/controllers/rewardProgramController.ts` — CRUD for programs
- `pos-backend/routes/rewardProgramRoute.ts` — Routes for programs

### Backend — Modified Files
- `pos-backend/models/customerModel.ts` — Remove store, add nickname/totalDishCount
- `pos-backend/models/orderModel.ts` — Add customer ref, appliedReward subdoc
- `pos-backend/controllers/customerController.ts` — Global scope, search, rewards endpoints
- `pos-backend/routes/customerRoute.ts` — Add search, rewards, history routes
- `pos-backend/controllers/orderController.ts` — Integrate RewardService on create/update/cancel
- `pos-backend/app.ts` — Mount rewardProgram route

### Frontend — New Files
- `pos-frontend/src/components/menu/CustomerLookup.jsx` — Search/auto-create customer in ordering flow
- `pos-frontend/src/components/menu/RewardSelector.jsx` — Show/apply rewards in ordering flow
- `pos-frontend/src/redux/slices/rewardSlice.js` — Reward programs + customer rewards state
- `pos-frontend/src/pages/RewardPrograms.jsx` — Admin page for managing programs
- `pos-frontend/src/pages/Customers.jsx` — Admin page for viewing customers
- `pos-frontend/src/components/dashboard/RewardsDashboard.jsx` — Analytics tab in dashboard

### Frontend — Modified Files
- `pos-frontend/src/https/index.js` — Add reward and customer search API functions
- `pos-frontend/src/redux/slices/customersSlice.js` — Add searchCustomers thunk
- `pos-frontend/src/redux/store.js` — Register rewardSlice
- `pos-frontend/src/components/menu/Bill.jsx` — Show reward discount line
- `pos-frontend/src/pages/MenuOrder.jsx` — Add CustomerLookup + RewardSelector to cart panel
- `pos-frontend/src/pages/index.js` — Export new pages
- `pos-frontend/src/constants/index.js` — Add ROUTES + PROTECTED_ROUTES entries
- `pos-frontend/src/App.jsx` — Register new page components in COMPONENT_MAP
- `pos-frontend/src/components/shared/Sidebar.jsx` — Add sidebar links

---

## Task 1: Migrate Customer Model to Global

**Files:**
- Modify: `pos-backend/models/customerModel.ts`

- [ ] **Step 1: Update the Customer schema**

Replace the entire file content with:

```typescript
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: ""
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: {
            validator: function (v: string) {
                return /^\d{10}$/.test(v);
            },
            message: "Phone number must be a 10-digit number!"
        }
    },
    nickname: {
        type: String,
        trim: true,
        default: ""
    },
    totalDishCount: {
        type: Number,
        min: 0,
        default: 0
    }
}, { timestamps: true });

customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ name: 1 });
customerSchema.index({ nickname: 1 });

export default mongoose.model("Customer", customerSchema);
```

- [ ] **Step 2: Verify the backend compiles**

Run: `cd pos-backend && npx tsc --noEmit`
Expected: Compilation errors in `customerController.ts` referencing `store` — this is expected, we fix it in Task 5.

- [ ] **Step 3: Commit**

```bash
git add pos-backend/models/customerModel.ts
git commit -m "feat(model): migrate Customer to global scope, add nickname and totalDishCount"
```

---

## Task 2: Create RewardProgram Model

**Files:**
- Create: `pos-backend/models/rewardProgramModel.ts`

- [ ] **Step 1: Create the RewardProgram schema**

Create `pos-backend/models/rewardProgramModel.ts`:

```typescript
import mongoose from "mongoose";

const rewardProgramSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },
    type: {
        type: String,
        required: true,
        enum: ["percentage_discount", "free_dish"]
    },
    dishThreshold: {
        type: Number,
        required: true,
        min: 1
    },
    discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    maxFreeDishValue: {
        type: Number,
        min: 0,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

rewardProgramSchema.index({ isActive: 1, priority: 1 });

export default mongoose.model("RewardProgram", rewardProgramSchema);
```

- [ ] **Step 2: Verify compilation**

Run: `cd pos-backend && npx tsc --noEmit`
Expected: No new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add pos-backend/models/rewardProgramModel.ts
git commit -m "feat(model): add RewardProgram model"
```

---

## Task 3: Create RewardLog Model

**Files:**
- Create: `pos-backend/models/rewardLogModel.ts`

- [ ] **Step 1: Create the RewardLog schema**

Create `pos-backend/models/rewardLogModel.ts`:

```typescript
import mongoose from "mongoose";

const rewardLogSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["dish_earned", "reward_unlocked", "reward_redeemed", "reward_restored", "reward_revoked", "dish_deducted"]
    },
    dishCount: {
        type: Number,
        default: 0
    },
    rewardProgram: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RewardProgram",
        default: null
    },
    cumulativeDishCount: {
        type: Number,
        required: true,
        min: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

rewardLogSchema.index({ customer: 1, type: 1 });
rewardLogSchema.index({ customer: 1, rewardProgram: 1, type: 1 });
rewardLogSchema.index({ order: 1 });

export default mongoose.model("RewardLog", rewardLogSchema);
```

- [ ] **Step 2: Commit**

```bash
git add pos-backend/models/rewardLogModel.ts
git commit -m "feat(model): add RewardLog model for reward audit trail"
```

---

## Task 4: Add Customer & Reward Fields to Order Model

**Files:**
- Modify: `pos-backend/models/orderModel.ts`

- [ ] **Step 1: Add customer ref and appliedReward to orderSchema**

In `pos-backend/models/orderModel.ts`, add after the `store` field (line ~115, inside `orderSchema`):

```typescript
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },
```

Add after the `appliedPromotions` field (after line ~147):

```typescript
    appliedReward: {
        rewardProgram: { type: mongoose.Schema.Types.ObjectId, ref: "RewardProgram" },
        rewardLog: { type: mongoose.Schema.Types.ObjectId, ref: "RewardLog" },
        type: { type: String, enum: ["percentage_discount", "free_dish"] },
        discountAmount: { type: Number, min: 0, default: 0 }
    },
```

Add a new index after the existing indexes (~line 203):

```typescript
orderSchema.index({ customer: 1, createdAt: -1 });
```

- [ ] **Step 2: Verify compilation**

Run: `cd pos-backend && npx tsc --noEmit`
Expected: No new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add pos-backend/models/orderModel.ts
git commit -m "feat(model): add customer ref and appliedReward to Order schema"
```

---

## Task 5: Create RewardService

**Files:**
- Create: `pos-backend/services/rewardService.ts`

- [ ] **Step 1: Implement the RewardService class**

Create `pos-backend/services/rewardService.ts`:

```typescript
import type { Types } from "mongoose";

import Customer from "../models/customerModel.js";
import RewardProgram from "../models/rewardProgramModel.js";
import RewardLog from "../models/rewardLogModel.js";

interface AvailableReward {
    rewardProgramId: Types.ObjectId;
    name: string;
    description: string;
    type: string;
    dishThreshold: number;
    discountPercent: number | null;
    maxFreeDishValue: number | null;
    earnedAtDishCount: number;
}

interface RedeemResult {
    rewardLog: InstanceType<typeof RewardLog>;
    type: string;
    discountPercent: number | null;
    maxFreeDishValue: number | null;
}

class RewardService {

    static async calculateAvailableRewards(customerId: string): Promise<AvailableReward[]> {
        const customer = await Customer.findById(customerId);
        if (!customer) return [];

        const programs = await RewardProgram.find({ isActive: true }).sort({ priority: 1 });
        if (programs.length === 0) return [];

        const redeemCounts = await RewardLog.aggregate([
            { $match: { customer: customer._id, type: { $in: ["reward_redeemed", "reward_restored", "reward_revoked"] } } },
            { $group: { _id: { rewardProgram: "$rewardProgram", type: "$type" }, count: { $sum: 1 } } }
        ]);

        const countMap: Record<string, Record<string, number>> = {};
        for (const row of redeemCounts) {
            const progId = String(row._id.rewardProgram);
            if (!countMap[progId]) countMap[progId] = {};
            countMap[progId][row._id.type] = row.count;
        }

        const available: AvailableReward[] = [];
        const totalDishes = customer.totalDishCount;

        for (const program of programs) {
            const progId = String(program._id);
            const threshold = program.dishThreshold;
            const totalEarned = Math.floor(totalDishes / threshold);

            const redeemed = (countMap[progId]?.["reward_redeemed"] || 0);
            const restored = (countMap[progId]?.["reward_restored"] || 0);
            const revoked = (countMap[progId]?.["reward_revoked"] || 0);
            const netUsed = redeemed - restored + revoked;

            const unredeemed = totalEarned - netUsed;

            for (let i = 0; i < unredeemed; i++) {
                const earnedAtCycle = netUsed + i + 1;
                available.push({
                    rewardProgramId: program._id as Types.ObjectId,
                    name: program.name,
                    description: program.description || "",
                    type: program.type,
                    dishThreshold: program.dishThreshold,
                    discountPercent: program.discountPercent,
                    maxFreeDishValue: program.maxFreeDishValue,
                    earnedAtDishCount: earnedAtCycle * threshold
                });
            }
        }

        return available;
    }

    static async earnDishes(
        customerId: string,
        orderId: string,
        storeId: string,
        dishCount: number,
        staffId: string
    ): Promise<{ newTotal: number; newRewards: AvailableReward[] }> {
        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { $inc: { totalDishCount: dishCount } },
            { new: true }
        );
        if (!customer) throw new Error("Customer not found");

        await RewardLog.create({
            customer: customerId,
            order: orderId,
            store: storeId,
            type: "dish_earned",
            dishCount,
            cumulativeDishCount: customer.totalDishCount,
            createdBy: staffId
        });

        const programs = await RewardProgram.find({ isActive: true });
        const previousTotal = customer.totalDishCount - dishCount;
        const newRewards: AvailableReward[] = [];

        for (const program of programs) {
            const prevCrossings = Math.floor(previousTotal / program.dishThreshold);
            const newCrossings = Math.floor(customer.totalDishCount / program.dishThreshold);

            for (let i = prevCrossings + 1; i <= newCrossings; i++) {
                await RewardLog.create({
                    customer: customerId,
                    order: orderId,
                    store: storeId,
                    type: "reward_unlocked",
                    rewardProgram: program._id,
                    cumulativeDishCount: customer.totalDishCount,
                    createdBy: staffId
                });

                newRewards.push({
                    rewardProgramId: program._id as Types.ObjectId,
                    name: program.name,
                    description: program.description || "",
                    type: program.type,
                    dishThreshold: program.dishThreshold,
                    discountPercent: program.discountPercent,
                    maxFreeDishValue: program.maxFreeDishValue,
                    earnedAtDishCount: i * program.dishThreshold
                });
            }
        }

        return { newTotal: customer.totalDishCount, newRewards };
    }

    static async redeemReward(
        customerId: string,
        orderId: string,
        storeId: string,
        rewardProgramId: string,
        staffId: string
    ): Promise<RedeemResult> {
        const available = await RewardService.calculateAvailableRewards(customerId);
        const match = available.find(r => String(r.rewardProgramId) === rewardProgramId);
        if (!match) throw new Error("Reward not available for redemption");

        const customer = await Customer.findById(customerId);
        if (!customer) throw new Error("Customer not found");

        const program = await RewardProgram.findById(rewardProgramId);
        if (!program) throw new Error("Reward program not found");

        const rewardLog = await RewardLog.create({
            customer: customerId,
            order: orderId,
            store: storeId,
            type: "reward_redeemed",
            rewardProgram: rewardProgramId,
            cumulativeDishCount: customer.totalDishCount,
            createdBy: staffId
        });

        return {
            rewardLog,
            type: program.type,
            discountPercent: program.discountPercent,
            maxFreeDishValue: program.maxFreeDishValue
        };
    }

    static async deductDishes(
        customerId: string,
        orderId: string,
        storeId: string,
        dishCount: number,
        staffId: string
    ): Promise<void> {
        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { $inc: { totalDishCount: -dishCount } },
            { new: true }
        );
        if (!customer) throw new Error("Customer not found");

        if (customer.totalDishCount < 0) {
            await Customer.findByIdAndUpdate(customerId, { totalDishCount: 0 });
            customer.totalDishCount = 0;
        }

        await RewardLog.create({
            customer: customerId,
            order: orderId,
            store: storeId,
            type: "dish_deducted",
            dishCount,
            cumulativeDishCount: customer.totalDishCount,
            createdBy: staffId
        });
    }

    static async restoreReward(
        customerId: string,
        orderId: string,
        storeId: string,
        rewardProgramId: string,
        staffId: string
    ): Promise<void> {
        const customer = await Customer.findById(customerId);
        if (!customer) throw new Error("Customer not found");

        await RewardLog.create({
            customer: customerId,
            order: orderId,
            store: storeId,
            type: "reward_restored",
            rewardProgram: rewardProgramId,
            cumulativeDishCount: customer.totalDishCount,
            createdBy: staffId
        });
    }

    static async getRewardAnalytics(period: string) {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "7d": startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case "30d": startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            case "90d": startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
            default: startDate = new Date(0);
        }

        const previousStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

        const [
            totalCustomers,
            newCustomers,
            rewardsRedeemed,
            prevRewardsRedeemed,
            programPerformance,
            topCustomers,
            customerSegments
        ] = await Promise.all([
            Customer.countDocuments(),
            Customer.countDocuments({ createdAt: { $gte: startDate } }),
            RewardLog.countDocuments({ type: "reward_redeemed", createdAt: { $gte: startDate } }),
            RewardLog.countDocuments({ type: "reward_redeemed", createdAt: { $gte: previousStart, $lt: startDate } }),
            RewardLog.aggregate([
                { $match: { type: { $in: ["reward_unlocked", "reward_redeemed"] } } },
                { $group: { _id: { rewardProgram: "$rewardProgram", type: "$type" }, count: { $sum: 1 } } }
            ]),
            Customer.find().sort({ totalDishCount: -1 }).limit(5).select("name phone totalDishCount"),
            Customer.aggregate([
                {
                    $bucket: {
                        groupBy: "$totalDishCount",
                        boundaries: [0, 2, 5, 10, Infinity],
                        default: "other",
                        output: { count: { $sum: 1 } }
                    }
                }
            ])
        ]);

        const programMap: Record<string, { unlocked: number; redeemed: number }> = {};
        for (const row of programPerformance) {
            const progId = String(row._id.rewardProgram);
            if (!programMap[progId]) programMap[progId] = { unlocked: 0, redeemed: 0 };
            programMap[progId][row._id.type === "reward_unlocked" ? "unlocked" : "redeemed"] = row.count;
        }

        const programs = await RewardProgram.find().select("name type dishThreshold isActive");
        const programStats = programs.map(p => ({
            ...p.toObject(),
            unlocked: programMap[String(p._id)]?.unlocked || 0,
            redeemed: programMap[String(p._id)]?.redeemed || 0,
            redemptionRate: programMap[String(p._id)]?.unlocked
                ? Math.round((programMap[String(p._id)]?.redeemed || 0) / programMap[String(p._id)]?.unlocked * 100)
                : 0
        }));

        return {
            totalCustomers,
            newCustomers,
            rewardsRedeemed,
            rewardsRedeemedGrowth: prevRewardsRedeemed > 0
                ? Math.round((rewardsRedeemed - prevRewardsRedeemed) / prevRewardsRedeemed * 100)
                : 0,
            programStats,
            topCustomers,
            customerSegments
        };
    }
}

export default RewardService;
```

- [ ] **Step 2: Verify compilation**

Run: `cd pos-backend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add pos-backend/services/rewardService.ts
git commit -m "feat(service): add RewardService with earn, redeem, deduct, restore, analytics"
```

---

## Task 6: Create RewardProgram Controller & Routes

**Files:**
- Create: `pos-backend/controllers/rewardProgramController.ts`
- Create: `pos-backend/routes/rewardProgramRoute.ts`
- Modify: `pos-backend/app.ts`

- [ ] **Step 1: Create the controller**

Create `pos-backend/controllers/rewardProgramController.ts`:

```typescript
import createHttpError from "http-errors";
import mongoose from "mongoose";
import RewardProgram from "../models/rewardProgramModel.js";
import RewardService from "../services/rewardService.js";

const addRewardProgram = async (req, res, next) => {
    try {
        const { name, description, type, dishThreshold, discountPercent, maxFreeDishValue, priority } = req.body;

        if (!name || !type || !dishThreshold) {
            return next(createHttpError(400, "Name, type, and dishThreshold are required!"));
        }

        if (type === "percentage_discount" && (discountPercent === undefined || discountPercent === null)) {
            return next(createHttpError(400, "discountPercent is required for percentage_discount type!"));
        }

        const program = new RewardProgram({
            name: String(name).trim(),
            description: description ? String(description).trim() : "",
            type,
            dishThreshold,
            discountPercent: type === "percentage_discount" ? discountPercent : null,
            maxFreeDishValue: maxFreeDishValue || null,
            priority: priority || 0,
            createdBy: req.user._id
        });

        await program.save();
        res.status(201).json({ success: true, message: "Reward program created!", data: program });
    } catch (error) {
        next(error);
    }
};

const getRewardPrograms = async (req, res, next) => {
    try {
        const filter: Record<string, unknown> = {};
        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === "true";
        }
        const programs = await RewardProgram.find(filter).sort({ priority: 1, createdAt: -1 });
        res.status(200).json({ success: true, data: programs });
    } catch (error) {
        next(error);
    }
};

const getRewardProgramById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }
        const program = await RewardProgram.findById(id);
        if (!program) return next(createHttpError(404, "Reward program not found!"));
        res.status(200).json({ success: true, data: program });
    } catch (error) {
        next(error);
    }
};

const updateRewardProgram = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }

        const { name, description, type, dishThreshold, discountPercent, maxFreeDishValue, priority } = req.body;
        const updates: Record<string, unknown> = {};

        if (name !== undefined) updates.name = String(name).trim();
        if (description !== undefined) updates.description = String(description).trim();
        if (type !== undefined) updates.type = type;
        if (dishThreshold !== undefined) updates.dishThreshold = dishThreshold;
        if (discountPercent !== undefined) updates.discountPercent = discountPercent;
        if (maxFreeDishValue !== undefined) updates.maxFreeDishValue = maxFreeDishValue;
        if (priority !== undefined) updates.priority = priority;

        const updated = await RewardProgram.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) return next(createHttpError(404, "Reward program not found!"));

        res.status(200).json({ success: true, message: "Reward program updated!", data: updated });
    } catch (error) {
        next(error);
    }
};

const toggleRewardProgramStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }
        const program = await RewardProgram.findById(id);
        if (!program) return next(createHttpError(404, "Reward program not found!"));

        program.isActive = !program.isActive;
        await program.save();
        res.status(200).json({ success: true, message: `Program ${program.isActive ? "activated" : "deactivated"}!`, data: program });
    } catch (error) {
        next(error);
    }
};

const deleteRewardProgram = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }
        const deleted = await RewardProgram.findByIdAndDelete(id);
        if (!deleted) return next(createHttpError(404, "Reward program not found!"));
        res.status(200).json({ success: true, message: "Reward program deleted!" });
    } catch (error) {
        next(error);
    }
};

const getRewardAnalytics = async (req, res, next) => {
    try {
        const period = (req.query.period as string) || "30d";
        const analytics = await RewardService.getRewardAnalytics(period);
        res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        next(error);
    }
};

export {
    addRewardProgram,
    getRewardPrograms,
    getRewardProgramById,
    updateRewardProgram,
    toggleRewardProgramStatus,
    deleteRewardProgram,
    getRewardAnalytics
};
```

- [ ] **Step 2: Create the route file**

Create `pos-backend/routes/rewardProgramRoute.ts`:

```typescript
import express from "express";
import {
    addRewardProgram,
    getRewardPrograms,
    getRewardProgramById,
    updateRewardProgram,
    toggleRewardProgramStatus,
    deleteRewardProgram,
    getRewardAnalytics
} from "../controllers/rewardProgramController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";

const router = express.Router();

router.use(isVerifiedUser);

router.route("/analytics").get(isAdmin, getRewardAnalytics);
router.route("/").get(getRewardPrograms);
router.route("/").post(isAdmin, addRewardProgram);
router.route("/:id").get(getRewardProgramById);
router.route("/:id").put(isAdmin, updateRewardProgram);
router.route("/:id/toggle-status").patch(isAdmin, toggleRewardProgramStatus);
router.route("/:id").delete(isAdmin, deleteRewardProgram);

export default router;
```

- [ ] **Step 3: Mount the route in app.ts**

In `pos-backend/app.ts`, add the import at the top with the other route imports:

```typescript
import rewardProgramRoute from "./routes/rewardProgramRoute.js";
```

Add the mount line after the existing routes (after `app.use("/api/ticket", ticketRoute);`):

```typescript
app.use("/api/reward-program", rewardProgramRoute);
```

- [ ] **Step 4: Verify compilation**

Run: `cd pos-backend && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add pos-backend/controllers/rewardProgramController.ts pos-backend/routes/rewardProgramRoute.ts pos-backend/app.ts
git commit -m "feat(api): add RewardProgram CRUD endpoints and analytics"
```

---

## Task 7: Refactor Customer Controller for Global Scope + Search + Rewards

**Files:**
- Modify: `pos-backend/controllers/customerController.ts`
- Modify: `pos-backend/routes/customerRoute.ts`

- [ ] **Step 1: Rewrite customerController.ts**

Replace `pos-backend/controllers/customerController.ts` with:

```typescript
import type { MongoFilter } from "../types/mongo.js";

import createHttpError from "http-errors";
import mongoose from "mongoose";
import Customer from "../models/customerModel.js";
import RewardService from "../services/rewardService.js";
import RewardLog from "../models/rewardLogModel.js";

const searchCustomers = async (req, res, next) => {
    try {
        const q = String(req.query.q || "").trim();
        if (!q || q.length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }

        const filter: MongoFilter = {
            $or: [
                { phone: { $regex: q, $options: "i" } },
                { name: { $regex: q, $options: "i" } },
                { nickname: { $regex: q, $options: "i" } }
            ]
        };

        const customers = await Customer.find(filter).limit(10).sort({ totalDishCount: -1 });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        next(error);
    }
};

const addCustomer = async (req, res, next) => {
    try {
        const { name, phone, nickname } = req.body;

        if (!phone) {
            return next(createHttpError(400, "Phone number is required!"));
        }

        const phoneStr = String(phone).trim();
        const exists = await Customer.findOne({ phone: phoneStr });
        if (exists) {
            return next(createHttpError(400, "Customer with this phone already exists!"));
        }

        const newCustomer = new Customer({
            name: name ? String(name).trim() : phoneStr,
            phone: phoneStr,
            nickname: nickname ? String(nickname).trim() : ""
        });

        await newCustomer.save();
        res.status(201).json({ success: true, message: "Customer created!", data: newCustomer });
    } catch (error) {
        next(error);
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find().sort({ totalDishCount: -1, createdAt: -1 });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        next(error);
    }
};

const getCustomerById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }
        const customer = await Customer.findById(id);
        if (!customer) return next(createHttpError(404, "Customer not found!"));
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }

        const { name, phone, nickname } = req.body;
        const updates: MongoFilter = {};
        if (name !== undefined) updates.name = String(name).trim();
        if (nickname !== undefined) updates.nickname = String(nickname).trim();
        if (phone !== undefined) {
            const phoneStr = String(phone).trim();
            const conflict = await Customer.findOne({ _id: { $ne: id }, phone: phoneStr });
            if (conflict) {
                return next(createHttpError(400, "Another customer with this phone already exists!"));
            }
            updates.phone = phoneStr;
        }

        const updated = await Customer.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) return next(createHttpError(404, "Customer not found!"));
        res.status(200).json({ success: true, message: "Customer updated!", data: updated });
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }
        const deleted = await Customer.findByIdAndDelete(id);
        if (!deleted) return next(createHttpError(404, "Customer not found!"));
        res.status(200).json({ success: true, message: "Customer deleted!" });
    } catch (error) {
        next(error);
    }
};

const getCustomerRewards = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }
        const customer = await Customer.findById(id);
        if (!customer) return next(createHttpError(404, "Customer not found!"));

        const available = await RewardService.calculateAvailableRewards(id);
        res.status(200).json({ success: true, data: { customer, rewards: available } });
    } catch (error) {
        next(error);
    }
};

const getCustomerHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }

        const logs = await RewardLog.find({ customer: id })
            .sort({ createdAt: -1 })
            .populate("rewardProgram", "name type dishThreshold")
            .populate("order", "bills.total orderDate")
            .populate("store", "name")
            .limit(100);

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        next(error);
    }
};

export {
    searchCustomers,
    addCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerRewards,
    getCustomerHistory
};
```

- [ ] **Step 2: Update customer routes**

Replace `pos-backend/routes/customerRoute.ts` with:

```typescript
import express from "express";
import {
    searchCustomers,
    addCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerRewards,
    getCustomerHistory
} from "../controllers/customerController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.use(isVerifiedUser);

router.route("/search").get(storeContext, searchCustomers);
router.route("/").post(storeContext, addCustomer);
router.route("/").get(isAdmin, getCustomers);
router.route("/:id").get(storeContext, getCustomerById);
router.route("/:id").put(isAdmin, updateCustomer);
router.route("/:id").delete(isAdmin, deleteCustomer);
router.route("/:id/rewards").get(storeContext, getCustomerRewards);
router.route("/:id/history").get(isAdmin, getCustomerHistory);

export default router;
```

- [ ] **Step 3: Verify compilation**

Run: `cd pos-backend && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add pos-backend/controllers/customerController.ts pos-backend/routes/customerRoute.ts
git commit -m "feat(api): refactor customer to global scope, add search and rewards endpoints"
```

---

## Task 8: Integrate RewardService into Order Controller

**Files:**
- Modify: `pos-backend/controllers/orderController.ts`

This task modifies the `addOrder` function to call `RewardService.earnDishes()` and optionally `RewardService.redeemReward()` when a customer is linked to the order.

- [ ] **Step 1: Read the current orderController.ts to understand the structure**

Read the full `pos-backend/controllers/orderController.ts` before making changes. The key integration points are:
- In `addOrder`: after order is saved, if `req.body.customer` is set, call `earnDishes()`. If `req.body.appliedReward` is set, call `redeemReward()`.
- In `updateOrder`: when status changes to "cancelled", call `deductDishes()` and `restoreReward()` if applicable.

- [ ] **Step 2: Add imports at the top of orderController.ts**

Add after the existing imports:

```typescript
import RewardService from "../services/rewardService.js";
```

- [ ] **Step 3: In `addOrder`, after the order is saved, add reward integration**

After the line that saves and populates the order (the `await newOrder.save()` and populate block), add the reward handling logic:

```typescript
        // Reward integration: earn dishes and optionally redeem reward
        if (req.body.customer) {
            const totalDishQuantity = savedOrder.items.reduce((sum, item) => sum + item.quantity, 0);
            try {
                await RewardService.earnDishes(
                    String(req.body.customer),
                    String(savedOrder._id),
                    String(req.store._id),
                    totalDishQuantity,
                    String(req.user._id)
                );

                if (req.body.appliedReward?.rewardProgram) {
                    const redeemResult = await RewardService.redeemReward(
                        String(req.body.customer),
                        String(savedOrder._id),
                        String(req.store._id),
                        String(req.body.appliedReward.rewardProgram),
                        String(req.user._id)
                    );
                    savedOrder.appliedReward = {
                        rewardProgram: req.body.appliedReward.rewardProgram,
                        rewardLog: redeemResult.rewardLog._id,
                        type: redeemResult.type,
                        discountAmount: req.body.appliedReward.discountAmount || 0
                    };
                    await savedOrder.save();
                }
            } catch (rewardError: unknown) {
                // Log but don't fail the order
                console.error("Reward processing error:", rewardError);
            }
        }
```

- [ ] **Step 4: In `updateOrder`, add cancellation handling**

In the `updateOrder` function, find where `orderStatus` is set to `"cancelled"`. After the status update is applied, add:

```typescript
        // Reward reversal on cancellation
        if (orderStatus === "cancelled" && existingOrder.customer) {
            try {
                const totalDishQuantity = existingOrder.items.reduce((sum, item) => sum + item.quantity, 0);
                await RewardService.deductDishes(
                    String(existingOrder.customer),
                    String(existingOrder._id),
                    String(req.store._id),
                    totalDishQuantity,
                    String(req.user._id)
                );
                if (existingOrder.appliedReward?.rewardProgram) {
                    await RewardService.restoreReward(
                        String(existingOrder.customer),
                        String(existingOrder._id),
                        String(req.store._id),
                        String(existingOrder.appliedReward.rewardProgram),
                        String(req.user._id)
                    );
                }
            } catch (rewardError: unknown) {
                console.error("Reward reversal error:", rewardError);
            }
        }
```

- [ ] **Step 5: Also ensure `customer` field is set on order creation**

In `addOrder`, where the `newOrder` object is constructed, add `customer: req.body.customer || null` to the fields.

- [ ] **Step 6: Verify compilation**

Run: `cd pos-backend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add pos-backend/controllers/orderController.ts
git commit -m "feat(order): integrate RewardService into order create and cancel flows"
```

---

## Task 9: Frontend API Functions

**Files:**
- Modify: `pos-frontend/src/https/index.js`

- [ ] **Step 1: Add reward and customer API functions**

Add to the end of `pos-frontend/src/https/index.js`, before the re-exports at the bottom:

```javascript
// Customer Search & Rewards Endpoints
export const searchCustomers = (query) => axiosWrapper.get(`/api/customer/search?q=${encodeURIComponent(query)}`);
export const getCustomerRewards = (customerId) => axiosWrapper.get(`/api/customer/${customerId}/rewards`);
export const getCustomerHistory = (customerId) => axiosWrapper.get(`/api/customer/${customerId}/history`);

// Reward Program Endpoints
export const getRewardPrograms = (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/reward-program${queryString ? `?${queryString}` : ''}`);
};
export const getRewardProgramById = (id) => axiosWrapper.get(`/api/reward-program/${id}`);
export const addRewardProgram = (data) => axiosWrapper.post("/api/reward-program", data);
export const updateRewardProgram = ({ id, ...data }) => axiosWrapper.put(`/api/reward-program/${id}`, data);
export const deleteRewardProgram = (id) => axiosWrapper.delete(`/api/reward-program/${id}`);
export const toggleRewardProgramStatus = (id) => axiosWrapper.patch(`/api/reward-program/${id}/toggle-status`);
export const getRewardAnalytics = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.period) queryParams.append('period', params.period);
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/reward-program/analytics${queryString ? `?${queryString}` : ''}`);
};
```

- [ ] **Step 2: Commit**

```bash
git add pos-frontend/src/https/index.js
git commit -m "feat(http): add reward program and customer search API functions"
```

---

## Task 10: Redux Slices — Rewards + Customer Search

**Files:**
- Create: `pos-frontend/src/redux/slices/rewardSlice.js`
- Modify: `pos-frontend/src/redux/slices/customersSlice.js`
- Modify: `pos-frontend/src/redux/store.js`

- [ ] **Step 1: Create rewardSlice.js**

Create `pos-frontend/src/redux/slices/rewardSlice.js`:

```javascript
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getRewardPrograms,
    addRewardProgram,
    updateRewardProgram,
    deleteRewardProgram,
    toggleRewardProgramStatus,
    getCustomerRewards,
    getRewardAnalytics
} from "../../https";

export const fetchRewardPrograms = createAsyncThunk("rewards/fetchPrograms", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getRewardPrograms(params);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch reward programs");
    }
});

export const createRewardProgram = createAsyncThunk("rewards/createProgram", async (payload, thunkAPI) => {
    try {
        const { data } = await addRewardProgram(payload);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create reward program");
    }
});

export const editRewardProgram = createAsyncThunk("rewards/updateProgram", async ({ id, ...updates }, thunkAPI) => {
    try {
        const { data } = await updateRewardProgram({ id, ...updates });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update reward program");
    }
});

export const removeRewardProgram = createAsyncThunk("rewards/deleteProgram", async (id, thunkAPI) => {
    try {
        await deleteRewardProgram(id);
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete reward program");
    }
});

export const toggleProgramStatus = createAsyncThunk("rewards/toggleStatus", async (id, thunkAPI) => {
    try {
        const { data } = await toggleRewardProgramStatus(id);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to toggle program status");
    }
});

export const fetchCustomerRewards = createAsyncThunk("rewards/fetchCustomerRewards", async (customerId, thunkAPI) => {
    try {
        const { data } = await getCustomerRewards(customerId);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch customer rewards");
    }
});

export const fetchRewardAnalytics = createAsyncThunk("rewards/fetchAnalytics", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getRewardAnalytics(params);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch analytics");
    }
});

const initialState = {
    programs: [],
    programsLoading: false,
    programsError: null,
    customerRewards: null,
    rewardsLoading: false,
    appliedReward: null,
    analytics: null,
    analyticsLoading: false
};

const rewardSlice = createSlice({
    name: "rewards",
    initialState,
    reducers: {
        applyReward: (state, action) => {
            state.appliedReward = action.payload;
        },
        removeAppliedReward: (state) => {
            state.appliedReward = null;
        },
        clearCustomerRewards: (state) => {
            state.customerRewards = null;
            state.appliedReward = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRewardPrograms.pending, (state) => { state.programsLoading = true; state.programsError = null; })
            .addCase(fetchRewardPrograms.fulfilled, (state, action) => { state.programsLoading = false; state.programs = action.payload || []; })
            .addCase(fetchRewardPrograms.rejected, (state, action) => { state.programsLoading = false; state.programsError = action.payload; })
            .addCase(createRewardProgram.fulfilled, (state, action) => { state.programs.unshift(action.payload); })
            .addCase(editRewardProgram.fulfilled, (state, action) => {
                const idx = state.programs.findIndex(p => p._id === action.payload._id);
                if (idx !== -1) state.programs[idx] = action.payload;
            })
            .addCase(removeRewardProgram.fulfilled, (state, action) => {
                state.programs = state.programs.filter(p => p._id !== action.payload);
            })
            .addCase(toggleProgramStatus.fulfilled, (state, action) => {
                const idx = state.programs.findIndex(p => p._id === action.payload._id);
                if (idx !== -1) state.programs[idx] = action.payload;
            })
            .addCase(fetchCustomerRewards.pending, (state) => { state.rewardsLoading = true; })
            .addCase(fetchCustomerRewards.fulfilled, (state, action) => { state.rewardsLoading = false; state.customerRewards = action.payload; })
            .addCase(fetchCustomerRewards.rejected, (state) => { state.rewardsLoading = false; })
            .addCase(fetchRewardAnalytics.pending, (state) => { state.analyticsLoading = true; })
            .addCase(fetchRewardAnalytics.fulfilled, (state, action) => { state.analyticsLoading = false; state.analytics = action.payload; })
            .addCase(fetchRewardAnalytics.rejected, (state) => { state.analyticsLoading = false; });
    }
});

export const { applyReward, removeAppliedReward, clearCustomerRewards } = rewardSlice.actions;
export default rewardSlice.reducer;
```

- [ ] **Step 2: Add searchCustomers to customersSlice.js**

Add this thunk after the existing imports and before `fetchCustomers` in `pos-frontend/src/redux/slices/customersSlice.js`:

```javascript
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, searchCustomers as searchCustomersApi } from "../../https";

export const searchCustomers = createAsyncThunk("customers/search", async (query, thunkAPI) => {
    try {
        const { data } = await searchCustomersApi(query);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to search customers");
    }
});
```

Add to the slice state: `searchResults: [], searchLoading: false`

Add extra reducers:

```javascript
            .addCase(searchCustomers.pending, (state) => { state.searchLoading = true; })
            .addCase(searchCustomers.fulfilled, (state, action) => { state.searchLoading = false; state.searchResults = action.payload || []; })
            .addCase(searchCustomers.rejected, (state) => { state.searchLoading = false; state.searchResults = []; })
```

Add a `clearSearchResults` reducer and export it.

- [ ] **Step 3: Register rewardSlice in store.js**

In `pos-frontend/src/redux/store.js`, add the import:

```javascript
import rewardReducer from "./slices/rewardSlice";
```

Add to the reducer map:

```javascript
        rewards: rewardReducer,
```

- [ ] **Step 4: Commit**

```bash
git add pos-frontend/src/redux/slices/rewardSlice.js pos-frontend/src/redux/slices/customersSlice.js pos-frontend/src/redux/store.js
git commit -m "feat(redux): add rewardSlice and customer search support"
```

---

## Task 11: CustomerLookup Component

**Files:**
- Create: `pos-frontend/src/components/menu/CustomerLookup.jsx`

- [ ] **Step 1: Create the component**

Create `pos-frontend/src/components/menu/CustomerLookup.jsx` — a search input with dropdown results. When no results, show an auto-create row with the typed phone highlighted as **NEW**. On tap, auto-creates customer with phone only. Selected customer shows as a card with dismiss (X) button. Component dispatches to `customersSlice` for search and `customerSlice` for session data. Full component code should:

- Use `useState` for query text and show/hide dropdown
- Debounce search with `useEffect` + `setTimeout` (300ms)
- Dispatch `searchCustomers(query)` from customersSlice
- On select existing: dispatch `setCustomerPhone`, `setCustomerName` to customerSlice, dispatch `fetchCustomerRewards(id)` to rewardSlice
- On "create new": dispatch `createCustomer({ phone })` then select
- On dismiss (X): clear customer from both slices, dispatch `clearCustomerRewards`
- Style with Tailwind matching the dark POS theme (#1a1a1a, #2a2a2a, #f6b100, #f5f5f5, #ababab)

- [ ] **Step 2: Commit**

```bash
git add pos-frontend/src/components/menu/CustomerLookup.jsx
git commit -m "feat(ui): add CustomerLookup component for ordering flow"
```

---

## Task 12: RewardSelector Component

**Files:**
- Create: `pos-frontend/src/components/menu/RewardSelector.jsx`

- [ ] **Step 1: Create the component**

Create `pos-frontend/src/components/menu/RewardSelector.jsx` — shows available rewards for the selected customer. Each reward has a "Use" button. Only one can be applied. Shows progress bar to next reward. Component reads from `rewardSlice.customerRewards` and dispatches `applyReward`/`removeAppliedReward`. Full component code should:

- Read `customerRewards` and `appliedReward` from rewardSlice
- If no customer selected or no rewards available, render nothing
- List available rewards with icon, name, description, "Use" button
- When a reward is applied, show it highlighted with a "Remove" option
- Progress bar: calculate next threshold from active programs and customer's totalDishCount
- Style matching the dark POS theme, green accent for rewards (#4ade80)

- [ ] **Step 2: Commit**

```bash
git add pos-frontend/src/components/menu/RewardSelector.jsx
git commit -m "feat(ui): add RewardSelector component for ordering flow"
```

---

## Task 13: Integrate into MenuOrder + Bill

**Files:**
- Modify: `pos-frontend/src/pages/MenuOrder.jsx`
- Modify: `pos-frontend/src/components/menu/Bill.jsx`

- [ ] **Step 1: Add CustomerLookup and RewardSelector to MenuOrder**

In `pos-frontend/src/pages/MenuOrder.jsx`, import the new components:

```javascript
import CustomerLookup from "../components/menu/CustomerLookup";
import RewardSelector from "../components/menu/RewardSelector";
```

In the right-side cart panel (the `hidden lg:flex` div), add them above `CartInfo`:

```jsx
        <CustomerLookup />
        <RewardSelector />
        <hr className="border-[#2a2a2a] border-t-2" />
```

- [ ] **Step 2: Modify Bill.jsx to show reward discount and include reward data in order**

In `pos-frontend/src/components/menu/Bill.jsx`:

- Import `useSelector` for reward state: `const appliedReward = useSelector(state => state.rewards.appliedReward);`
- Import `const selectedCustomer = useSelector(state => state.rewards.customerRewards?.customer);`
- In the bill display section, after the coupon discount display, add a reward discount line if `appliedReward` is set (green text, similar pattern to coupon)
- In `handlePlaceOrder`, add `customer: selectedCustomer?._id || null` and `appliedReward` (with rewardProgram ID and discountAmount) to `orderData`
- Adjust the total calculation to account for reward discount

- [ ] **Step 3: Verify the frontend compiles**

Run: `cd pos-frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add pos-frontend/src/pages/MenuOrder.jsx pos-frontend/src/components/menu/Bill.jsx
git commit -m "feat(ui): integrate customer lookup and rewards into ordering flow"
```

---

## Task 14: RewardPrograms Admin Page

**Files:**
- Create: `pos-frontend/src/pages/RewardPrograms.jsx`

- [ ] **Step 1: Create the admin page**

Create `pos-frontend/src/pages/RewardPrograms.jsx` — follow the pattern of existing admin pages like `PromotionManager`. Card-based list of reward programs. Each card: name, type, threshold, discount, active toggle, edit/delete. A modal or form for creating/editing programs. Fields: name, description, type (dropdown), dishThreshold, discountPercent (conditional), maxFreeDishValue (conditional), priority. Uses `rewardSlice` thunks.

- [ ] **Step 2: Commit**

```bash
git add pos-frontend/src/pages/RewardPrograms.jsx
git commit -m "feat(ui): add RewardPrograms admin page"
```

---

## Task 15: Customers Admin Page

**Files:**
- Create: `pos-frontend/src/pages/Customers.jsx`

- [ ] **Step 1: Create the admin page**

Create `pos-frontend/src/pages/Customers.jsx` — table view of all customers. Columns: name/avatar, phone, totalDishCount, available rewards count, times redeemed. Search input. "View" button navigates to detail (or opens modal with reward history). Edit name/nickname. Uses `customersSlice` for data.

- [ ] **Step 2: Commit**

```bash
git add pos-frontend/src/pages/Customers.jsx
git commit -m "feat(ui): add Customers admin page"
```

---

## Task 16: RewardsDashboard Component

**Files:**
- Create: `pos-frontend/src/components/dashboard/RewardsDashboard.jsx`

- [ ] **Step 1: Create the analytics component**

Create `pos-frontend/src/components/dashboard/RewardsDashboard.jsx` — a tab/section for the existing Dashboard page. Period selector (7D/30D/90D/ALL). KPI cards (total customers, rewards redeemed, retention rate, discount given). Customer segments bar chart. Program performance cards. Top customers list. Uses `fetchRewardAnalytics` from rewardSlice.

- [ ] **Step 2: Integrate into the Dashboard page**

In the existing Dashboard page component, add a tab or section that renders `RewardsDashboard`.

- [ ] **Step 3: Commit**

```bash
git add pos-frontend/src/components/dashboard/RewardsDashboard.jsx
git commit -m "feat(ui): add rewards analytics dashboard"
```

---

## Task 17: Register Routes, Pages, and Sidebar Links

**Files:**
- Modify: `pos-frontend/src/constants/index.js`
- Modify: `pos-frontend/src/pages/index.js`
- Modify: `pos-frontend/src/App.jsx`
- Modify: `pos-frontend/src/components/shared/Sidebar.jsx`

- [ ] **Step 1: Add route constants**

In `pos-frontend/src/constants/index.js`, add to `ROUTES`:

```javascript
  REWARD_PROGRAMS: "/reward-programs",
  CUSTOMERS: "/customers",
```

Add to `PROTECTED_ROUTES`:

```javascript
  {
    path: ROUTES.REWARD_PROGRAMS,
    componentName: "RewardPrograms",
    adminOnly: true
  },
  {
    path: ROUTES.CUSTOMERS,
    componentName: "Customers",
    adminOnly: true
  },
```

- [ ] **Step 2: Export new pages**

In `pos-frontend/src/pages/index.js`, add exports:

```javascript
export { default as RewardPrograms } from "./RewardPrograms";
export { default as Customers } from "./Customers";
```

- [ ] **Step 3: Register in App.jsx**

In `pos-frontend/src/App.jsx`, add imports:

```javascript
import { ..., RewardPrograms, Customers } from "./pages";
```

Add to `COMPONENT_MAP`:

```javascript
  RewardPrograms,
  Customers,
```

- [ ] **Step 4: Add sidebar links**

In `pos-frontend/src/components/shared/Sidebar.jsx`, add menu items for "Customers" and "Reward Programs" in the admin section, with appropriate icons (e.g., `MdPeople` for customers, `MdCardGiftcard` for rewards).

- [ ] **Step 5: Verify the frontend builds**

Run: `cd pos-frontend && npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pos-frontend/src/constants/index.js pos-frontend/src/pages/index.js pos-frontend/src/App.jsx pos-frontend/src/components/shared/Sidebar.jsx
git commit -m "feat(routing): register reward programs and customers pages with sidebar links"
```

---

## Task 18: End-to-End Smoke Test

- [ ] **Step 1: Start backend**

Run: `cd pos-backend && npm run dev`
Expected: Server starts on port 3000.

- [ ] **Step 2: Start frontend**

Run: `cd pos-frontend && npm run dev`
Expected: Vite dev server starts on port 5173.

- [ ] **Step 3: Manual smoke test checklist**

1. Navigate to `/reward-programs` — create a "Buy 5 Get 10% Off" program (type: percentage_discount, threshold: 5, discountPercent: 10)
2. Navigate to `/reward-programs` — create a "Buy 10 Get Free Dish" program (type: free_dish, threshold: 10)
3. Go to `/menu-order` — type a phone number in customer search — see "NEW" badge — tap to create
4. Add 5+ items to cart — see reward notification appear
5. Tap "Use" on the 10% reward — see discount in bill
6. Place order — order saves with customer ref and appliedReward
7. Navigate to `/customers` — see the new customer with dish count
8. Navigate to `/dashboard` — see rewards analytics tab with data

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete customer rewards system implementation"
```
