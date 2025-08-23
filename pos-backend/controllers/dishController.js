const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Dish = require("../models/dishModel");
const Category = require("../models/categoryModel");

const addDish = async (req, res, next) => {
    try {
        const { 
            name, 
            price, 
            category, 
            cost, 
            note, 
            image, 
            hasSizeVariants, 
            sizeVariants, 
            isAvailable, 
            ingredients 
        } = req.body;

        // Basic validation
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

        // Validate size variants if enabled
        if (hasSizeVariants) {
            if (!sizeVariants || !Array.isArray(sizeVariants) || sizeVariants.length === 0) {
                const error = createHttpError(400, "Size variants are required when hasSizeVariants is true!");
                return next(error);
            }

            // Validate each size variant
            for (const variant of sizeVariants) {
                if (!variant.size || typeof variant.price !== 'number' || variant.price < 0) {
                    const error = createHttpError(400, "Each size variant must have a valid size and price!");
                    return next(error);
                }
                
                if (variant.cost !== undefined && (typeof variant.cost !== 'number' || variant.cost < 0)) {
                    const error = createHttpError(400, "Size variant cost must be a non-negative number!");
                    return next(error);
                }
            }

            // Validate that sizes are unique
            const sizes = sizeVariants.map(v => v.size);
            const uniqueSizes = [...new Set(sizes)];
            if (sizes.length !== uniqueSizes.length) {
                const error = createHttpError(400, "Size variant sizes must be unique!");
                return next(error);
            }

            // Ensure at least one default variant
            const defaultVariants = sizeVariants.filter(v => v.isDefault);
            if (defaultVariants.length === 0) {
                sizeVariants[0].isDefault = true;
            } else if (defaultVariants.length > 1) {
                // Keep only the first default
                sizeVariants.forEach((variant, index) => {
                    variant.isDefault = index === sizeVariants.findIndex(v => v.isDefault);
                });
            }
        }

        // Validate image URL if provided
        if (image && typeof image !== 'string') {
            const error = createHttpError(400, "Image must be a valid URL string!");
            return next(error);
        }

        const newDish = new Dish({
            name: name.trim(),
            price,
            category,
            cost: typeof cost === 'number' ? cost : 0,
            note: note ? String(note).trim() : "",
            image: image ? String(image).trim() : "",
            hasSizeVariants: Boolean(hasSizeVariants),
            sizeVariants: hasSizeVariants ? sizeVariants : [],
            isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
            ingredients: ingredients || {}
        });

        await newDish.save();
        const populated = await newDish.populate({ path: 'category', select: 'name' });
        res.status(201).json({ success: true, message: "Dish created successfully!", data: populated });
    } catch (error) {
        next(error);
    }
}

const getDishes = async (req, res, next) => {
    try {
        const dishes = await Dish.find()
            .populate({ path: 'category', select: 'name' })
            .sort({ createdAt: -1 });
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
        const { 
            name, 
            price, 
            category, 
            cost, 
            note, 
            image, 
            hasSizeVariants, 
            sizeVariants, 
            isAvailable, 
            ingredients 
        } = req.body;

        // Update basic fields
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
        
        if (image !== undefined) {
            if (image && typeof image !== 'string') {
                const error = createHttpError(400, "Image must be a valid URL string!");
                return next(error);
            }
            updates.image = image ? String(image).trim() : "";
        }
        
        if (isAvailable !== undefined) updates.isAvailable = Boolean(isAvailable);
        
        if (ingredients !== undefined) updates.ingredients = ingredients;

        // Handle size variants
        if (hasSizeVariants !== undefined) {
            updates.hasSizeVariants = Boolean(hasSizeVariants);
            
            if (hasSizeVariants) {
                if (!sizeVariants || !Array.isArray(sizeVariants) || sizeVariants.length === 0) {
                    const error = createHttpError(400, "Size variants are required when hasSizeVariants is true!");
                    return next(error);
                }

                // Validate each size variant
                for (const variant of sizeVariants) {
                    if (!variant.size || typeof variant.price !== 'number' || variant.price < 0) {
                        const error = createHttpError(400, "Each size variant must have a valid size and price!");
                        return next(error);
                    }
                    
                    if (variant.cost !== undefined && (typeof variant.cost !== 'number' || variant.cost < 0)) {
                        const error = createHttpError(400, "Size variant cost must be a non-negative number!");
                        return next(error);
                    }
                }

                // Validate that sizes are unique
                const sizes = sizeVariants.map(v => v.size);
                const uniqueSizes = [...new Set(sizes)];
                if (sizes.length !== uniqueSizes.length) {
                    const error = createHttpError(400, "Size variant sizes must be unique!");
                    return next(error);
                }

                // Ensure at least one default variant
                const defaultVariants = sizeVariants.filter(v => v.isDefault);
                if (defaultVariants.length === 0) {
                    sizeVariants[0].isDefault = true;
                } else if (defaultVariants.length > 1) {
                    // Keep only the first default
                    sizeVariants.forEach((variant, index) => {
                        variant.isDefault = index === sizeVariants.findIndex(v => v.isDefault);
                    });
                }

                updates.sizeVariants = sizeVariants;
            } else {
                updates.sizeVariants = [];
            }
        }

        const updated = await Dish.findByIdAndUpdate(id, updates, { new: true })
            .populate({ path: 'category', select: 'name' });
        
        if (!updated) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Dish updated successfully!", data: updated });
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

        res.status(200).json({ success: true, message: "Dish deleted successfully!" });
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

// New function to get available dishes only
const getAvailableDishes = async (req, res, next) => {
    try {
        const dishes = await Dish.find({ isAvailable: true })
            .populate({ path: 'category', select: 'name' })
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        next(error);
    }
}

// New function to toggle dish availability
const toggleDishAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const dish = await Dish.findById(id);
        if (!dish) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        dish.isAvailable = !dish.isAvailable;
        await dish.save();

        const populated = await dish.populate({ path: 'category', select: 'name' });
        
        res.status(200).json({ 
            success: true, 
            message: `Dish ${dish.isAvailable ? 'enabled' : 'disabled'} successfully!`, 
            data: populated 
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    addDish, 
    getDishes, 
    getDishById, 
    updateDish, 
    deleteDish, 
    getDishesByCategory,
    getAvailableDishes,
    toggleDishAvailability
}; 