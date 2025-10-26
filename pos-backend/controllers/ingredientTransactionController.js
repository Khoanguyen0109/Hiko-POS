const createHttpError = require("http-errors");
const Ingredient = require("../models/ingredientModel");
const IngredientTransaction = require("../models/ingredientTransactionModel");
const { default: mongoose } = require("mongoose");

// Import ingredient (add stock)
const importIngredient = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            ingredientId,
            quantity,
            unitCost,
            supplierId,
            supplierName,
            batchNumber,
            expiryDate,
            qualityGrade,
            purchaseOrderNumber,
            notes
        } = req.body;

        // Validate
        if (!ingredientId || !mongoose.Types.ObjectId.isValid(ingredientId)) {
            return next(createHttpError(400, "Valid ingredient ID is required"));
        }

        if (!quantity || quantity <= 0) {
            return next(createHttpError(400, "Valid quantity is required"));
        }

        if (unitCost === undefined || unitCost < 0) {
            return next(createHttpError(400, "Valid unit cost is required"));
        }

        // Get ingredient
        const ingredient = await Ingredient.findById(ingredientId);
        if (!ingredient) {
            return next(createHttpError(404, "Ingredient not found"));
        }

        // Generate transaction number
        const transactionNumber = `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Calculate
        const totalCost = quantity * unitCost;
        const stockBefore = ingredient.inventory.currentStock;
        const stockAfter = stockBefore + quantity;

        // Create transaction
        const transaction = new IngredientTransaction({
            transactionNumber,
            type: 'IMPORT',
            ingredientId,
            quantity,
            unit: ingredient.unit,
            unitCost,
            totalCost,
            stockBefore,
            stockAfter,
            importDetails: {
                purchaseOrderNumber,
                supplierId,
                supplierName,
                batchNumber,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                qualityGrade
            },
            createdBy: userId && userName ? { userId, userName } : undefined,
            notes
        });

        await transaction.save();

        // Update ingredient inventory
        ingredient.inventory.currentStock = stockAfter;
        
        // Update average cost (weighted average)
        const oldTotalValue = stockBefore * ingredient.costs.averageCost;
        const newTotalValue = oldTotalValue + totalCost;
        ingredient.costs.averageCost = stockAfter > 0 ? newTotalValue / stockAfter : 0;
        ingredient.costs.lastPurchaseCost = unitCost;
        
        await ingredient.save();

        // Populate
        await transaction.populate('ingredientId', 'name code unit');

        res.status(201).json({
            success: true,
            message: "Ingredient imported successfully",
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// Export ingredient (reduce stock)
const exportIngredient = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            ingredientId,
            quantity,
            orderId,
            dishId,
            dishName,
            reason = 'PRODUCTION',
            notes
        } = req.body;

        // Validate
        if (!ingredientId || !mongoose.Types.ObjectId.isValid(ingredientId)) {
            return next(createHttpError(400, "Valid ingredient ID is required"));
        }

        if (!quantity || quantity <= 0) {
            return next(createHttpError(400, "Valid quantity is required"));
        }

        // Get ingredient
        const ingredient = await Ingredient.findById(ingredientId);
        if (!ingredient) {
            return next(createHttpError(404, "Ingredient not found"));
        }

        // Check stock
        if (ingredient.inventory.currentStock < quantity) {
            return next(createHttpError(400, `Insufficient stock. Available: ${ingredient.inventory.currentStock} ${ingredient.unit}`));
        }

        // Generate transaction number
        const transactionNumber = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Calculate
        const unitCost = ingredient.costs.averageCost || 0;
        const totalCost = quantity * unitCost;
        const stockBefore = ingredient.inventory.currentStock;
        const stockAfter = stockBefore - quantity;

        // Create transaction
        const transaction = new IngredientTransaction({
            transactionNumber,
            type: 'EXPORT',
            ingredientId,
            quantity,
            unit: ingredient.unit,
            unitCost,
            totalCost,
            stockBefore,
            stockAfter,
            exportDetails: {
                orderId,
                dishId,
                dishName,
                reason
            },
            createdBy: userId && userName ? { userId, userName } : undefined,
            notes
        });

        await transaction.save();

        // Update inventory
        ingredient.inventory.currentStock = stockAfter;
        await ingredient.save();

        // Populate
        await transaction.populate('ingredientId', 'name code unit');

        res.status(201).json({
            success: true,
            message: "Ingredient exported successfully",
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// Adjust ingredient stock (corrections)
const adjustIngredient = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            ingredientId,
            quantity, // positive for increase, negative for decrease
            reason,
            notes
        } = req.body;

        // Validate
        if (!ingredientId || !mongoose.Types.ObjectId.isValid(ingredientId)) {
            return next(createHttpError(400, "Valid ingredient ID is required"));
        }

        if (quantity === undefined || quantity === 0) {
            return next(createHttpError(400, "Valid quantity is required (positive or negative)"));
        }

        // Get ingredient
        const ingredient = await Ingredient.findById(ingredientId);
        if (!ingredient) {
            return next(createHttpError(404, "Ingredient not found"));
        }

        const stockBefore = ingredient.inventory.currentStock;
        const stockAfter = stockBefore + quantity;

        if (stockAfter < 0) {
            return next(createHttpError(400, "Adjustment would result in negative stock"));
        }

        // Generate transaction number
        const transactionNumber = `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Calculate
        const unitCost = ingredient.costs.averageCost || 0;
        const totalCost = Math.abs(quantity) * unitCost;

        // Create transaction
        const transaction = new IngredientTransaction({
            transactionNumber,
            type: 'ADJUSTMENT',
            ingredientId,
            quantity: Math.abs(quantity),
            unit: ingredient.unit,
            unitCost,
            totalCost,
            stockBefore,
            stockAfter,
            adjustmentDetails: {
                reason,
                approvedBy: userId && userName ? { userId, userName } : undefined
            },
            createdBy: userId && userName ? { userId, userName } : undefined,
            notes
        });

        await transaction.save();

        // Update inventory
        ingredient.inventory.currentStock = stockAfter;
        await ingredient.save();

        // Populate
        await transaction.populate('ingredientId', 'name code unit');

        res.status(201).json({
            success: true,
            message: "Ingredient adjusted successfully",
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// Get transactions
const getTransactions = async (req, res, next) => {
    try {
        const {
            ingredientId,
            type,
            startDate,
            endDate,
            page = 1,
            limit = 50,
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};

        if (ingredientId) {
            query.ingredientId = ingredientId;
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (startDate || endDate) {
            query.transactionDate = {};
            if (startDate) query.transactionDate.$gte = new Date(startDate);
            if (endDate) query.transactionDate.$lte = new Date(endDate);
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute
        const [transactions, totalCount] = await Promise.all([
            IngredientTransaction.find(query)
                .sort({ transactionDate: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('ingredientId', 'name code unit')
                .populate('createdBy.userId', 'name'),
            IngredientTransaction.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            success: true,
            data: transactions,
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

// Get transaction by ID
const getTransactionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid transaction ID"));
        }

        const transaction = await IngredientTransaction.findById(id)
            .populate('ingredientId', 'name code unit category')
            .populate('createdBy.userId', 'name')
            .populate('exportDetails.orderId')
            .populate('exportDetails.dishId', 'name');

        if (!transaction) {
            return next(createHttpError(404, "Transaction not found"));
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// Delete ingredient transaction
const deleteTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid transaction ID"));
        }

        // Get transaction
        const transaction = await IngredientTransaction.findById(id);
        if (!transaction) {
            return next(createHttpError(404, "Transaction not found"));
        }

        // Get ingredient
        const ingredient = await Ingredient.findById(transaction.ingredientId);
        if (!ingredient) {
            return next(createHttpError(404, "Ingredient not found"));
        }

        // Reverse the transaction effect on inventory
        const currentStock = ingredient.inventory.currentStock;

        switch (transaction.type) {
            case 'IMPORT':
                // Reverse import: subtract the imported quantity
                ingredient.inventory.currentStock = currentStock - transaction.quantity;
                
                // Recalculate average cost after removing this import
                // Get all remaining import transactions for this ingredient
                const remainingImports = await IngredientTransaction.find({
                    ingredientId: transaction.ingredientId,
                    type: 'IMPORT',
                    _id: { $ne: id }
                }).sort({ transactionDate: 1 });

                // Recalculate average cost from remaining imports
                let totalValue = 0;
                let totalQuantity = 0;
                
                for (const imp of remainingImports) {
                    totalValue += imp.totalCost;
                    totalQuantity += imp.quantity;
                }

                // Add current stock from exports/adjustments
                const exportedQuantity = await IngredientTransaction.aggregate([
                    {
                        $match: {
                            ingredientId: transaction.ingredientId,
                            type: { $in: ['EXPORT', 'ADJUSTMENT'] },
                            _id: { $ne: id }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$quantity' }
                        }
                    }
                ]);

                const totalExported = exportedQuantity.length > 0 ? Math.abs(exportedQuantity[0].total) : 0;
                const calculatedStock = totalQuantity - totalExported;

                ingredient.costs.averageCost = calculatedStock > 0 ? totalValue / calculatedStock : 0;
                break;

            case 'EXPORT':
                // Reverse export: add back the exported quantity
                ingredient.inventory.currentStock = currentStock + transaction.quantity;
                // Average cost remains the same for exports
                break;

            case 'ADJUSTMENT':
                // Reverse adjustment
                ingredient.inventory.currentStock = currentStock - transaction.quantity;
                // Average cost remains the same for adjustments
                break;

            case 'WASTE':
            case 'RETURN':
                // Reverse waste/return
                ingredient.inventory.currentStock = currentStock - transaction.quantity;
                break;

            default:
                break;
        }

        // Ensure stock doesn't go negative
        if (ingredient.inventory.currentStock < 0) {
            return next(createHttpError(400, "Cannot delete transaction: would result in negative stock"));
        }

        // Delete transaction
        await IngredientTransaction.findByIdAndDelete(id);

        // Save ingredient
        await ingredient.save();

        res.json({
            success: true,
            message: "Transaction deleted successfully",
            data: {
                deletedTransactionId: id,
                newStock: ingredient.inventory.currentStock,
                newAverageCost: ingredient.costs.averageCost
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    importIngredient,
    exportIngredient,
    adjustIngredient,
    getTransactions,
    getTransactionById,
    deleteTransaction
};

