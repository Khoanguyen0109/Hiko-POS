const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Customer = require("../models/customerModel");

const addCustomer = async (req, res, next) => {
    try {
        const { name, phone, point, class: customerClass } = req.body;

        if (!name || !phone) {
            const error = createHttpError(400, "Please provide name and phone!");
            return next(error);
        }

        const exists = await Customer.findOne({ phone: String(phone).trim() });
        if (exists) {
            const error = createHttpError(400, "Customer with this phone already exist!");
            return next(error);
        }

        const newCustomer = new Customer({
            name: String(name).trim(),
            phone: String(phone).trim(),
            point: typeof point === 'number' ? point : undefined,
            class: customerClass ? String(customerClass).trim() : undefined
        });

        await newCustomer.save();
        res.status(201).json({ success: true, message: "Customer created!", data: newCustomer });
    } catch (error) {
        next(error);
    }
}

const getCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        next(error);
    }
}

const getCustomerById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const customer = await Customer.findById(id);
        if (!customer) {
            const error = createHttpError(404, "Customer not found!");
            return next(error);
        }

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
}

const updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const { name, phone, point, class: customerClass } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = String(name).trim();
        if (phone !== undefined) updates.phone = String(phone).trim();
        if (point !== undefined) {
            if (typeof point !== 'number' || point < 0) {
                const error = createHttpError(400, "Point must be a non-negative number!");
                return next(error);
            }
            updates.point = point;
        }
        if (customerClass !== undefined) updates.class = String(customerClass).trim();

        if (updates.phone) {
            const conflict = await Customer.findOne({ _id: { $ne: id }, phone: updates.phone });
            if (conflict) {
                const error = createHttpError(400, "Another customer with this phone already exist!");
                return next(error);
            }
        }

        const updated = await Customer.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) {
            const error = createHttpError(404, "Customer not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Customer updated!", data: updated });
    } catch (error) {
        next(error);
    }
}

const deleteCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const deleted = await Customer.findByIdAndDelete(id);
        if (!deleted) {
            const error = createHttpError(404, "Customer not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Customer deleted!" });
    } catch (error) {
        next(error);
    }
}

module.exports = { addCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer }; 