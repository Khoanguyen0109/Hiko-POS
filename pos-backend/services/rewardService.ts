import type { Types } from "mongoose";

import Customer from "../models/customerModel.js";
import RewardProgram from "../models/rewardProgramModel.js";
import RewardLog from "../models/rewardLogModel.js";
import Dish from "../models/dishModel.js";
import Order from "../models/orderModel.js";

interface AvailableReward {
    rewardProgramId: Types.ObjectId;
    name: string;
    description: string;
    type: string;
    dishThreshold: number;
    discountPercent: number | null;
    maxFreeDishValue: number | null;
    earnedAtDishCount: number;
    eligibleCategories?: Types.ObjectId[];
}

interface RedeemResult {
    rewardLog: InstanceType<typeof RewardLog>;
    type: string;
    discountPercent: number | null;
    maxFreeDishValue: number | null;
}

interface OrderItem {
    dishId: string | Types.ObjectId;
    quantity: number;
    category?: string;
}

type CategoryBreakdown = Record<string, number>;

class RewardService {

    /**
     * Resolve order items to a { [categoryId]: quantity } breakdown.
     * Uses batched Dish lookup to get category ObjectIds from dishIds.
     */
    static async buildCategoryBreakdown(items: OrderItem[]): Promise<CategoryBreakdown> {
        const dishIds = [...new Set(items.map(i => String(i.dishId)))];
        const dishes = await Dish.find({ _id: { $in: dishIds } }).select("category").lean();
        const dishCatMap = new Map<string, string>();
        for (const d of dishes) {
            if (d.category) dishCatMap.set(String(d._id), String(d.category));
        }

        const breakdown: CategoryBreakdown = {};
        for (const item of items) {
            const catId = dishCatMap.get(String(item.dishId));
            if (catId) {
                breakdown[catId] = (breakdown[catId] || 0) + item.quantity;
            }
        }
        return breakdown;
    }

    /**
     * Get the effective dish count for a program given the customer's counts.
     * Programs without eligibleCategories use totalDishCount.
     * Programs with eligibleCategories sum only matching category counts.
     */
    static getDishCountForProgram(
        program: { eligibleCategories?: Types.ObjectId[] },
        totalDishCount: number,
        categoryDishCounts: Map<string, number> | Record<string, number>
    ): number {
        if (!program.eligibleCategories || program.eligibleCategories.length === 0) {
            return totalDishCount;
        }
        let count = 0;
        for (const catId of program.eligibleCategories) {
            const key = String(catId);
            if (categoryDishCounts instanceof Map) {
                count += categoryDishCounts.get(key) || 0;
            } else {
                count += (categoryDishCounts as Record<string, number>)[key] || 0;
            }
        }
        return count;
    }

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
        const catCounts = customer.categoryDishCounts || new Map<string, number>();

        for (const program of programs) {
            const progId = String(program._id);
            const threshold = program.dishThreshold;
            const dishCount = RewardService.getDishCountForProgram(
                program,
                customer.totalDishCount,
                catCounts
            );
            const totalEarned = Math.floor(dishCount / threshold);

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
                    earnedAtDishCount: earnedAtCycle * threshold,
                    eligibleCategories: program.eligibleCategories
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
        staffId: string,
        items?: OrderItem[]
    ): Promise<{ newTotal: number; newRewards: AvailableReward[] }> {
        const categoryBreakdown = items ? await RewardService.buildCategoryBreakdown(items) : {};

        const incUpdate: Record<string, number> = { totalDishCount: dishCount };
        for (const [catId, qty] of Object.entries(categoryBreakdown)) {
            incUpdate[`categoryDishCounts.${catId}`] = qty;
        }

        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { $inc: incUpdate },
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
        const catCounts = customer.categoryDishCounts || new Map<string, number>();
        const newRewards: AvailableReward[] = [];

        for (const program of programs) {
            const currentCount = RewardService.getDishCountForProgram(
                program,
                customer.totalDishCount,
                catCounts
            );

            let previousCount: number;
            if (!program.eligibleCategories || program.eligibleCategories.length === 0) {
                previousCount = customer.totalDishCount - dishCount;
            } else {
                let delta = 0;
                for (const catId of program.eligibleCategories) {
                    delta += categoryBreakdown[String(catId)] || 0;
                }
                previousCount = currentCount - delta;
            }

            const prevCrossings = Math.floor(previousCount / program.dishThreshold);
            const newCrossings = Math.floor(currentCount / program.dishThreshold);

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
                    earnedAtDishCount: i * program.dishThreshold,
                    eligibleCategories: program.eligibleCategories
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
        staffId: string,
        items?: OrderItem[]
    ): Promise<void> {
        const categoryBreakdown = items ? await RewardService.buildCategoryBreakdown(items) : {};

        const incUpdate: Record<string, number> = { totalDishCount: -dishCount };
        for (const [catId, qty] of Object.entries(categoryBreakdown)) {
            incUpdate[`categoryDishCounts.${catId}`] = -qty;
        }

        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { $inc: incUpdate },
            { new: true }
        );
        if (!customer) throw new Error("Customer not found");

        if (customer.totalDishCount < 0) {
            await Customer.findByIdAndUpdate(customerId, { totalDishCount: 0 });
            customer.totalDishCount = 0;
        }

        // Clamp negative category counts to 0
        if (customer.categoryDishCounts) {
            const fixes: Record<string, number> = {};
            for (const [key, val] of customer.categoryDishCounts.entries()) {
                if (val < 0) fixes[`categoryDishCounts.${key}`] = 0;
            }
            if (Object.keys(fixes).length > 0) {
                await Customer.findByIdAndUpdate(customerId, { $set: fixes });
            }
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

    /**
     * Rebuild categoryDishCounts for all customers from their order history.
     * Call once after deploying category-based reward tracking.
     */
    static async backfillCategoryDishCounts(): Promise<{ updated: number }> {
        const customers = await Customer.find({ totalDishCount: { $gt: 0 } }).select("_id");
        let updated = 0;

        for (const cust of customers) {
            const orders = await Order.find({
                customer: cust._id,
                orderStatus: { $ne: "cancelled" }
            }).select("items.dishId items.quantity").lean();

            const allItems: OrderItem[] = [];
            for (const order of orders) {
                for (const item of order.items) {
                    allItems.push({ dishId: item.dishId, quantity: item.quantity });
                }
            }

            if (allItems.length === 0) continue;

            const breakdown = await RewardService.buildCategoryBreakdown(allItems);
            if (Object.keys(breakdown).length === 0) continue;

            const catMap = new Map<string, number>();
            for (const [catId, qty] of Object.entries(breakdown)) {
                catMap.set(catId, qty);
            }

            await Customer.findByIdAndUpdate(cust._id, {
                $set: { categoryDishCounts: catMap }
            });
            updated++;
        }

        return { updated };
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

        const programs = await RewardProgram.find().select("name type dishThreshold isActive eligibleCategories").populate("eligibleCategories", "name");
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
