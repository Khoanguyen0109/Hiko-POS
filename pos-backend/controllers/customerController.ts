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
