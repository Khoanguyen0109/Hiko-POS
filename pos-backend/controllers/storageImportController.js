const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const StorageImport = require("../models/storageImportModel");
const StorageItem = require("../models/storageItemModel");
const Supplier = require("../models/supplierModel");
const { Spending, SpendingCategory } = require("../models/spendingModel");

// Helper function to get or create "Ingredient" category
const getIngredientCategory = async () => {
    let category = await SpendingCategory.findOne({ name: "Ingredient" });
    if (!category) {
        // Create Ingredient category if it doesn't exist
        category = new SpendingCategory({
            name: "Ingredient",
            description: "Storage imports and ingredient purchases",
            color: "#10B981",
            isActive: true
        });
        await category.save();
    }
    return category;
};

// Create import record
const createStorageImport = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            storageItemId,
            quantity,
            unitCost,
            supplierId,
            supplierInvoice,
            notes
        } = req.body;

        // Validate required fields
        if (!storageItemId || !mongoose.Types.ObjectId.isValid(storageItemId)) {
            return next(createHttpError(400, "Valid storage item ID is required"));
        }

        if (!quantity || quantity <= 0) {
            return next(createHttpError(400, "Quantity must be greater than 0"));
        }

        if (!unitCost || unitCost < 0) {
            return next(createHttpError(400, "Unit cost must be a non-negative number"));
        }

        // Validate storage item exists and is active
        const storageItem = await StorageItem.findById(storageItemId);
        if (!storageItem) {
            return next(createHttpError(404, "Storage item not found"));
        }
        if (!storageItem.isActive) {
            return next(createHttpError(400, "Storage item is not active"));
        }

        // Validate supplier if provided
        let supplier = null;
        let supplierName = null;
        if (supplierId) {
            if (!mongoose.Types.ObjectId.isValid(supplierId)) {
                return next(createHttpError(400, "Invalid supplier ID"));
            }
            supplier = await Supplier.findById(supplierId);
            if (!supplier) {
                return next(createHttpError(404, "Supplier not found"));
            }
            if (!supplier.isActive) {
                return next(createHttpError(400, "Supplier is not active"));
            }
            supplierName = supplier.name;
        }

        // Generate import number
        const importNumber = await StorageImport.generateImportNumber();

        // Calculate total cost
        const totalCost = quantity * unitCost;

        // Get Ingredient category
        const ingredientCategory = await getIngredientCategory();

        // Create spending record
        const spending = new Spending({
            title: `Import: ${storageItem.name}`,
            amount: totalCost,
            currency: 'VND',
            category: ingredientCategory._id,
            vendor: supplierId || undefined,
            vendorName: supplierName || undefined,
            paymentStatus: 'paid',
            paymentMethod: 'cash',
            paymentDate: new Date(),
            invoiceNumber: supplierInvoice || undefined,
            notes: notes ? `${notes} (Import: ${importNumber})` : `Import: ${importNumber}`,
            approvalStatus: 'approved',
            createdBy: userId && userName ? { userId, userName } : undefined
        });
        await spending.save();

        // Create import record
        const storageImport = new StorageImport({
            importNumber,
            storageItemId,
            quantity,
            unit: storageItem.unit,
            unitCost,
            totalCost,
            supplierId: supplierId || undefined,
            supplierName: supplierName || undefined,
            supplierInvoice: supplierInvoice || undefined,
            notes: notes || undefined,
            spendingId: spending._id,
            status: 'completed', // Auto-complete on creation
            importedBy: userId && userName ? { userId, userName } : undefined,
            importDate: new Date()
        });
        await storageImport.save();

        // Update storage item stock and costs
        const stockBefore = storageItem.currentStock;
        const stockAfter = stockBefore + quantity;

        // Calculate weighted average cost
        let newAverageCost = storageItem.averageCost;
        if (stockBefore > 0) {
            newAverageCost = (
                (stockBefore * storageItem.averageCost) + (quantity * unitCost)
            ) / (stockBefore + quantity);
        } else {
            newAverageCost = unitCost;
        }

        storageItem.currentStock = stockAfter;
        storageItem.averageCost = newAverageCost;
        storageItem.lastPurchaseCost = unitCost;
        await storageItem.save();

        // Populate references for response
        await storageImport.populate([
            { path: 'storageItemId', select: 'name code unit' },
            { path: 'supplierId', select: 'name code' }
        ]);

        res.status(201).json({
            success: true,
            message: "Import created successfully!",
            data: storageImport,
            spending: spending
        });
    } catch (error) {
        next(error);
    }
};

// Get all import records
const getStorageImports = async (req, res, next) => {
    try {
        const {
            storageItemId,
            supplierId,
            status,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        // Build query
        let query = {};

        if (storageItemId && mongoose.Types.ObjectId.isValid(storageItemId)) {
            query.storageItemId = storageItemId;
        }

        if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
            query.supplierId = supplierId;
        }

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.importDate = {};
            if (startDate) {
                query.importDate.$gte = new Date(startDate);
            }
            if (endDate) {
                query.importDate.$lte = new Date(endDate);
            }
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const [imports, totalCount] = await Promise.all([
            StorageImport.find(query)
                .populate('storageItemId', 'name code unit')
                .populate('supplierId', 'name code')
                .populate('importedBy.userId', 'name')
                .sort({ importDate: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            StorageImport.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: imports,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get import record by ID
const getStorageImportById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid import ID"));
        }

        const importRecord = await StorageImport.findById(id)
            .populate('storageItemId')
            .populate('supplierId')
            .populate('importedBy.userId', 'name')
            .populate('spendingId')
            .lean();

        if (!importRecord) {
            return next(createHttpError(404, "Import record not found"));
        }

        res.status(200).json({
            success: true,
            data: importRecord
        });
    } catch (error) {
        next(error);
    }
};

// Update import record
const updateStorageImport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            quantity,
            unitCost,
            supplierId,
            supplierInvoice,
            notes,
            status
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid import ID"));
        }

        const importRecord = await StorageImport.findById(id);
        if (!importRecord) {
            return next(createHttpError(404, "Import record not found"));
        }

        // Can only update pending imports
        if (importRecord.status !== 'pending' && status !== 'cancelled') {
            return next(createHttpError(400, "Can only update pending imports or cancel completed imports"));
        }

        const storageItem = await StorageItem.findById(importRecord.storageItemId);
        if (!storageItem) {
            return next(createHttpError(404, "Storage item not found"));
        }

        // Handle status change to cancelled
        if (status === 'cancelled' && importRecord.status === 'completed') {
            // Reverse stock changes
            storageItem.currentStock -= importRecord.quantity;
            // Note: Average cost reversal is complex, so we'll leave it as is
            await storageItem.save();

            importRecord.status = 'cancelled';
            await importRecord.save();

            return res.status(200).json({
                success: true,
                message: "Import cancelled successfully!",
                data: importRecord
            });
        }

        // Update fields
        let stockChanged = false;
        let costChanged = false;

        if (quantity !== undefined && quantity !== importRecord.quantity) {
            if (quantity <= 0) {
                return next(createHttpError(400, "Quantity must be greater than 0"));
            }
            stockChanged = true;
            importRecord.quantity = quantity;
        }

        if (unitCost !== undefined && unitCost !== importRecord.unitCost) {
            if (unitCost < 0) {
                return next(createHttpError(400, "Unit cost must be a non-negative number"));
            }
            costChanged = true;
            importRecord.unitCost = unitCost;
        }

        // Recalculate total cost if quantity or unitCost changed
        if (stockChanged || costChanged) {
            importRecord.totalCost = importRecord.quantity * importRecord.unitCost;
        }

        // Update supplier if provided
        if (supplierId !== undefined) {
            if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
                const supplier = await Supplier.findById(supplierId);
                if (!supplier) {
                    return next(createHttpError(404, "Supplier not found"));
                }
                importRecord.supplierId = supplierId;
                importRecord.supplierName = supplier.name;
            } else {
                importRecord.supplierId = undefined;
                importRecord.supplierName = undefined;
            }
        }

        if (supplierInvoice !== undefined) {
            importRecord.supplierInvoice = supplierInvoice ? supplierInvoice.trim() : undefined;
        }

        if (notes !== undefined) {
            importRecord.notes = notes ? notes.trim() : undefined;
        }

        if (status && status !== importRecord.status) {
            // Handle status change to completed
            if (status === 'completed' && importRecord.status === 'pending') {
                // Update stock
                const stockBefore = storageItem.currentStock;
                const stockAfter = stockBefore + importRecord.quantity;

                // Calculate weighted average cost
                let newAverageCost = storageItem.averageCost;
                if (stockBefore > 0) {
                    newAverageCost = (
                        (stockBefore * storageItem.averageCost) + (importRecord.quantity * importRecord.unitCost)
                    ) / (stockBefore + importRecord.quantity);
                } else {
                    newAverageCost = importRecord.unitCost;
                }

                storageItem.currentStock = stockAfter;
                storageItem.averageCost = newAverageCost;
                storageItem.lastPurchaseCost = importRecord.unitCost;
                await storageItem.save();
            }
            importRecord.status = status;
        }

        await importRecord.save();

        // Update spending record if total cost changed
        if (costChanged && importRecord.spendingId) {
            const spending = await Spending.findById(importRecord.spendingId);
            if (spending) {
                spending.amount = importRecord.totalCost;
                if (importRecord.supplierId) {
                    spending.vendor = importRecord.supplierId;
                    spending.vendorName = importRecord.supplierName;
                }
                await spending.save();
            }
        }

        await importRecord.populate([
            { path: 'storageItemId', select: 'name code unit' },
            { path: 'supplierId', select: 'name code' }
        ]);

        res.status(200).json({
            success: true,
            message: "Import updated successfully!",
            data: importRecord
        });
    } catch (error) {
        next(error);
    }
};

// Cancel import record
const cancelStorageImport = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid import ID"));
        }

        const importRecord = await StorageImport.findById(id);
        if (!importRecord) {
            return next(createHttpError(404, "Import record not found"));
        }

        if (importRecord.status === 'cancelled') {
            return next(createHttpError(400, "Import is already cancelled"));
        }

        const storageItem = await StorageItem.findById(importRecord.storageItemId);
        if (!storageItem) {
            return next(createHttpError(404, "Storage item not found"));
        }

        // Reverse stock changes if import was completed
        if (importRecord.status === 'completed') {
            storageItem.currentStock -= importRecord.quantity;
            // Note: Average cost reversal is complex, so we'll leave it as is
            await storageItem.save();
        }

        importRecord.status = 'cancelled';
        await importRecord.save();

        res.status(200).json({
            success: true,
            message: "Import cancelled successfully!",
            data: importRecord
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createStorageImport,
    getStorageImports,
    getStorageImportById,
    updateStorageImport,
    cancelStorageImport
};
