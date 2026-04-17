// @ts-nocheck
import createHttpError from "http-errors";
import mongoose from "mongoose";
import RewardProgram from "../models/rewardProgramModel.js";
import RewardService from "../services/rewardService.js";

const addRewardProgram = async (req, res, next) => {
    try {
        const { name, type, dishThreshold, discountPercent, maxFreeDishValue, description, priority, eligibleCategories } = req.body;

        if (!name || !type || !dishThreshold) {
            const error = createHttpError(400, "Name, type, and dishThreshold are required!");
            return next(error);
        }

        if (type === "percentage_discount" && (discountPercent === undefined || discountPercent === null)) {
            const error = createHttpError(400, "discountPercent is required for percentage_discount type!");
            return next(error);
        }

        const program = new RewardProgram({
            name,
            type,
            dishThreshold,
            discountPercent: discountPercent ?? null,
            maxFreeDishValue: maxFreeDishValue ?? null,
            description: description || "",
            priority: priority ?? 0,
            eligibleCategories: eligibleCategories || [],
            createdBy: req.user._id,
        });

        await program.save();
        await program.populate("eligibleCategories", "name color");

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

        const programs = await RewardProgram.find(filter)
            .populate("eligibleCategories", "name color")
            .sort({ priority: 1, createdAt: -1 });

        res.status(200).json({ success: true, data: programs });
    } catch (error) {
        next(error);
    }
};

const getRewardProgramById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid reward program ID!");
            return next(error);
        }

        const program = await RewardProgram.findById(id).populate("eligibleCategories", "name color");
        if (!program) {
            const error = createHttpError(404, "Reward program not found!");
            return next(error);
        }

        res.status(200).json({ success: true, data: program });
    } catch (error) {
        next(error);
    }
};

const updateRewardProgram = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid reward program ID!");
            return next(error);
        }

        const { name, type, dishThreshold, discountPercent, maxFreeDishValue, description, priority, eligibleCategories } = req.body;
        const updates: Record<string, unknown> = {};

        if (name !== undefined) updates.name = name;
        if (type !== undefined) updates.type = type;
        if (dishThreshold !== undefined) updates.dishThreshold = dishThreshold;
        if (discountPercent !== undefined) updates.discountPercent = discountPercent;
        if (maxFreeDishValue !== undefined) updates.maxFreeDishValue = maxFreeDishValue;
        if (description !== undefined) updates.description = description;
        if (priority !== undefined) updates.priority = priority;
        if (eligibleCategories !== undefined) updates.eligibleCategories = eligibleCategories;

        const updated = await RewardProgram.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
            .populate("eligibleCategories", "name color");
        if (!updated) {
            const error = createHttpError(404, "Reward program not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Reward program updated!", data: updated });
    } catch (error) {
        next(error);
    }
};

const toggleRewardProgramStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid reward program ID!");
            return next(error);
        }

        const program = await RewardProgram.findById(id);
        if (!program) {
            const error = createHttpError(404, "Reward program not found!");
            return next(error);
        }

        program.isActive = !program.isActive;
        await program.save();

        res.status(200).json({
            success: true,
            message: `Reward program ${program.isActive ? "activated" : "deactivated"} successfully`,
            data: program,
        });
    } catch (error) {
        next(error);
    }
};

const deleteRewardProgram = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid reward program ID!");
            return next(error);
        }

        const deleted = await RewardProgram.findByIdAndDelete(id);
        if (!deleted) {
            const error = createHttpError(404, "Reward program not found!");
            return next(error);
        }

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

const backfillCategoryDishCounts = async (req, res, next) => {
    try {
        const result = await RewardService.backfillCategoryDishCounts();
        res.status(200).json({
            success: true,
            message: `Backfill complete. Updated ${result.updated} customer(s).`,
            data: result
        });
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
    getRewardAnalytics,
    backfillCategoryDishCounts,
};
