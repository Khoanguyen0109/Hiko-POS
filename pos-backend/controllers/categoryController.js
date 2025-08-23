const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Category = require("../models/categoryModel");

const addCategory = async (req, res, next) => {
    try {
        const { name, description, color, isActive } = req.body;

        if (!name || !name.trim()) {
            const error = createHttpError(400, "Please provide category name!");
            return next(error);
        }

        if (name.trim().length < 2) {
            const error = createHttpError(400, "Category name must be at least 2 characters!");
            return next(error);
        }

        if (name.trim().length > 50) {
            const error = createHttpError(400, "Category name must be less than 50 characters!");
            return next(error);
        }

        // Check for existing category with same name
        const isPresent = await Category.findOne({ name: name.trim() });
        if (isPresent) {
            const error = createHttpError(400, "Category already exists!");
            return next(error);
        }

        // Validate color if provided
        if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
            const error = createHttpError(400, "Color must be a valid hex color code!");
            return next(error);
        }

        // Validate description length
        if (description && description.length > 200) {
            const error = createHttpError(400, "Description must be less than 200 characters!");
            return next(error);
        }

        const newCategory = new Category({
            name: name.trim(),
            description: description ? description.trim() : "",
            color: color || "#f6b100",
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        await newCategory.save();
        res.status(201).json({ 
            success: true, 
            message: "Category created successfully!", 
            data: newCategory 
        });
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

const getActiveCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
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
        const { name, description, color, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const updates = {};

        // Update name if provided
        if (name !== undefined) {
            if (!name.trim()) {
                const error = createHttpError(400, "Category name cannot be empty!");
                return next(error);
            }

            if (name.trim().length < 2) {
                const error = createHttpError(400, "Category name must be at least 2 characters!");
                return next(error);
            }

            if (name.trim().length > 50) {
                const error = createHttpError(400, "Category name must be less than 50 characters!");
                return next(error);
            }

            // Check for name conflicts
            const conflict = await Category.findOne({ _id: { $ne: id }, name: name.trim() });
            if (conflict) {
                const error = createHttpError(400, "Category with this name already exists!");
                return next(error);
            }

            updates.name = name.trim();
        }

        // Update description if provided
        if (description !== undefined) {
            if (description.length > 200) {
                const error = createHttpError(400, "Description must be less than 200 characters!");
                return next(error);
            }
            updates.description = description.trim();
        }

        // Update color if provided
        if (color !== undefined) {
            if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                const error = createHttpError(400, "Color must be a valid hex color code!");
                return next(error);
            }
            updates.color = color || "#f6b100";
        }

        // Update isActive if provided
        if (isActive !== undefined) {
            updates.isActive = Boolean(isActive);
        }

        const updated = await Category.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        res.status(200).json({ 
            success: true, 
            message: "Category updated successfully!", 
            data: updated 
        });
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

        res.status(200).json({ 
            success: true, 
            message: "Category deleted successfully!" 
        });
    } catch (error) {
        next(error);
    }
}

const toggleCategoryStatus = async (req, res, next) => {
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

        category.isActive = !category.isActive;
        await category.save();

        res.status(200).json({ 
            success: true, 
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully!`, 
            data: category 
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    addCategory, 
    getCategories, 
    getActiveCategories,
    getCategoryById, 
    updateCategory, 
    deleteCategory,
    toggleCategoryStatus
}; 