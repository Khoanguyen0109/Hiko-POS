const createHttpError = require("http-errors");
const Ingredient = require("../models/ingredientModel");
const IngredientTransaction = require("../models/ingredientTransactionModel");
const { default: mongoose } = require("mongoose");

// Add ingredient
const addIngredient = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            name,
            code,
            description,
            category,
            unit,
            inventory,
            costs,
            storage,
            suppliers,
            notes
        } = req.body;

        // Validate required fields
        if (!name || name.trim().length === 0) {
            return next(createHttpError(400, "Name is required"));
        }

        if (!code || code.trim().length === 0) {
            return next(createHttpError(400, "Code is required"));
        }

        // Check if ingredient with same name or code exists
        const existingIngredient = await Ingredient.findOne({
            $or: [
                { name: name.trim() },
                { code: code.trim().toUpperCase() }
            ]
        });

        if (existingIngredient) {
            return next(createHttpError(400, "Ingredient with this name or code already exists"));
        }

        // Create ingredient
        const ingredient = new Ingredient({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description?.trim(),
            category: category || 'Other',
            unit: unit || 'kg',
            inventory: inventory || {},
            costs: costs || {},
            storage: storage || {},
            suppliers: suppliers || [],
            notes: notes?.trim(),
            createdBy: userId && userName ? { userId, userName } : undefined
        });

        await ingredient.save();

        res.status(201).json({
            success: true,
            message: "Ingredient created successfully",
            data: ingredient
        });
    } catch (error) {
        next(error);
    }
};

// Get all ingredients
const getIngredients = async (req, res, next) => {
    try {
        const {
            category,
            isActive,
            stockStatus,
            search,
            page = 1,
            limit = 50,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sort
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [ingredients, totalCount] = await Promise.all([
            Ingredient.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .populate('suppliers.supplierId', 'name')
                .lean(),
            Ingredient.countDocuments(query)
        ]);

        // Filter by stock status if needed
        let filteredIngredients = ingredients;
        if (stockStatus && stockStatus !== 'all') {
            filteredIngredients = ingredients.filter(ing => {
                const stock = ing.inventory.currentStock;
                const reorder = ing.inventory.reorderPoint;
                const min = ing.inventory.minStock;

                if (stockStatus === 'OUT_OF_STOCK') return stock <= 0;
                if (stockStatus === 'LOW_STOCK') return stock > 0 && stock <= reorder;
                if (stockStatus === 'CRITICAL') return stock > 0 && stock <= min;
                if (stockStatus === 'IN_STOCK') return stock > reorder;
                return true;
            });
        }

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            success: true,
            data: filteredIngredients,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get ingredient by ID
const getIngredientById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid ingredient ID"));
        }

        const ingredient = await Ingredient.findById(id)
            .populate('suppliers.supplierId', 'name phone email')
            .populate('createdBy.userId', 'name')
            .populate('lastModifiedBy.userId', 'name');

        if (!ingredient) {
            return next(createHttpError(404, "Ingredient not found"));
        }

        res.json({
            success: true,
            data: ingredient
        });
    } catch (error) {
        next(error);
    }
};

// Update ingredient
const updateIngredient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { _id: userId, name: userName } = req.user || {};

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid ingredient ID"));
        }

        const ingredient = await Ingredient.findById(id);
        if (!ingredient) {
            return next(createHttpError(404, "Ingredient not found"));
        }

        // Update fields
        const allowedUpdates = [
            'name', 'description', 'category', 'unit', 'inventory',
            'costs', 'storage', 'suppliers', 'isActive', 'notes'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                ingredient[field] = req.body[field];
            }
        });

        ingredient.lastModifiedBy = userId && userName ? { userId, userName } : undefined;

        await ingredient.save();

        res.json({
            success: true,
            message: "Ingredient updated successfully",
            data: ingredient
        });
    } catch (error) {
        next(error);
    }
};

// Delete ingredient
const deleteIngredient = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid ingredient ID"));
        }

        const ingredient = await Ingredient.findById(id);
        if (!ingredient) {
            return next(createHttpError(404, "Ingredient not found"));
        }

        // Soft delete - mark as inactive
        ingredient.isActive = false;
        await ingredient.save();

        res.json({
            success: true,
            message: "Ingredient deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Get low stock ingredients
const getLowStockIngredients = async (req, res, next) => {
    try {
        const ingredients = await Ingredient.find({
            isActive: true,
            $expr: { $lte: ["$inventory.currentStock", "$inventory.reorderPoint"] }
        }).sort({ 'inventory.currentStock': 1 });

        res.json({
            success: true,
            data: ingredients,
            count: ingredients.length
        });
    } catch (error) {
        next(error);
    }
};

// Get ingredient transaction history
const getIngredientHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 20 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid ingredient ID"));
        }

        const transactions = await IngredientTransaction.find({ ingredientId: id })
            .sort({ transactionDate: -1 })
            .limit(parseInt(limit))
            .populate('createdBy.userId', 'name');

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addIngredient,
    getIngredients,
    getIngredientById,
    updateIngredient,
    deleteIngredient,
    getLowStockIngredients,
    getIngredientHistory
};

