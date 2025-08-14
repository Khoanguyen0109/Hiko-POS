const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Dish = require("../models/dishModel");
const Category = require("../models/categoryModel");

const addDish = async (req, res, next) => {
    try {
        const { name, price, category, cost, note, ingredients } = req.body;

        if (!name || price === undefined || !category) {
            const error = createHttpError(400, "Please provide name, price and category!");
            return next(error);
        }

        if (typeof price !== 'number' || price < 0) {
            const error = createHttpError(400, "Price must be a non-negative number!");
            return next(error);
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            const error = createHttpError(400, "Invalid category id!");
            return next(error);
        }

        const categoryExists = await Category.exists({ _id: category });
        if (!categoryExists) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        const newDish = new Dish({
            name: name.trim(),
            price,
            category,
            cost: typeof cost === 'number' ? cost : undefined,
            note: note ? String(note).trim() : undefined,
            ingredients: ingredients || undefined
        });

        await newDish.save();
        const populated = await newDish.populate({ path: 'category', select: 'name' });
        res.status(201).json({ success: true, message: "Dish created!", data: populated });
    } catch (error) {
        next(error);
    }
}

const getDishes = async (req, res, next) => {
    try {
        const dishes = await Dish.find().populate({ path: 'category', select: 'name' }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        next(error);
    }
}

const getDishById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const dish = await Dish.findById(id).populate({ path: 'category', select: 'name' });
        if (!dish) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        res.status(200).json({ success: true, data: dish });
    } catch (error) {
        next(error);
    }
}

const updateDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const updates = {};
        const { name, price, category, cost, note, ingredients } = req.body;

        if (name !== undefined) updates.name = String(name).trim();
        if (price !== undefined) {
            if (typeof price !== 'number' || price < 0) {
                const error = createHttpError(400, "Price must be a non-negative number!");
                return next(error);
            }
            updates.price = price;
        }
        if (category !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                const error = createHttpError(400, "Invalid category id!");
                return next(error);
            }
            const categoryExists = await Category.exists({ _id: category });
            if (!categoryExists) {
                const error = createHttpError(404, "Category not found!");
                return next(error);
            }
            updates.category = category;
        }
        if (cost !== undefined) {
            if (typeof cost !== 'number' || cost < 0) {
                const error = createHttpError(400, "Cost must be a non-negative number!");
                return next(error);
            }
            updates.cost = cost;
        }
        if (note !== undefined) updates.note = String(note).trim();
        if (ingredients !== undefined) updates.ingredients = ingredients;

        const updated = await Dish.findByIdAndUpdate(id, updates, { new: true }).populate({ path: 'category', select: 'name' });
        if (!updated) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Dish updated!", data: updated });
    } catch (error) {
        next(error);
    }
}

const deleteDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const deleted = await Dish.findByIdAndDelete(id);
        if (!deleted) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Dish deleted!" });
    } catch (error) {
        next(error);
    }
}

const getDishesByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const error = createHttpError(404, "Invalid category id!");
            return next(error);
        }

        const categoryExists = await Category.exists({ _id: categoryId });
        if (!categoryExists) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        const dishes = await Dish.find({ category: categoryId })
            .populate({ path: 'category', select: 'name' })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        next(error);
    }
}

module.exports = { addDish, getDishes, getDishById, updateDish, deleteDish, getDishesByCategory }; 