const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Category = require("../models/categoryModel");

const addCategory = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            const error = createHttpError(400, "Please provide category name!");
            return next(error);
        }

        const isPresent = await Category.findOne({ name: name.trim() });
        if (isPresent) {
            const error = createHttpError(400, "Category already exist!");
            return next(error);
        }

        const newCategory = new Category({ name: name.trim() });
        await newCategory.save();
        res.status(201).json({ success: true, message: "Category created!", data: newCategory });
    } catch (error) {
        next(error);
    }
}

const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
}

const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const category = await Category.findById(id);
        if (!category) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
}

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        if (!name || !name.trim()) {
            const error = createHttpError(400, "Please provide category name!");
            return next(error);
        }

        const conflict = await Category.findOne({ _id: { $ne: id }, name: name.trim() });
        if (conflict) {
            const error = createHttpError(400, "Category with this name already exist!");
            return next(error);
        }

        const updated = await Category.findByIdAndUpdate(id, { name: name.trim() }, { new: true });
        if (!updated) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Category updated!", data: updated });
    } catch (error) {
        next(error);
    }
}

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const deleted = await Category.findByIdAndDelete(id);
        if (!deleted) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Category deleted!" });
    } catch (error) {
        next(error);
    }
}

module.exports = { addCategory, getCategories, getCategoryById, updateCategory, deleteCategory }; 