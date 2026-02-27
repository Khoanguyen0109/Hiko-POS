const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const StorageItem = require("../models/storageItemModel");
const StorageImport = require("../models/storageImportModel");
const StorageExport = require("../models/storageExportModel");

// Add storage item
const addStorageItem = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            name,
            code,
            description,
            category,
            unit,
            minStock,
            maxStock,
            averageCost,
            lastPurchaseCost
        } = req.body;

        // Validate required fields
        if (!name || name.trim().length === 0) {
            return next(createHttpError(400, "Name is required"));
        }

        if (!code || code.trim().length === 0) {
            return next(createHttpError(400, "Code is required"));
        }

        if (!unit) {
            return next(createHttpError(400, "Unit is required"));
        }

        // Check if storage item with same name or code exists
        const existingItem = await StorageItem.findOne({
            $or: [
                { name: name.trim() },
                { code: code.trim().toUpperCase() }
            ]
        });

        if (existingItem) {
            return next(createHttpError(400, "Storage item with this name or code already exists"));
        }

        // Validate unit enum
        const validUnits = ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'box', 'bag'];
        if (!validUnits.includes(unit)) {
            return next(createHttpError(400, `Unit must be one of: ${validUnits.join(', ')}`));
        }

        // Validate stock levels
        if (minStock !== undefined && (typeof minStock !== 'number' || minStock < 0)) {
            return next(createHttpError(400, "Min stock must be a non-negative number"));
        }

        if (maxStock !== undefined && (typeof maxStock !== 'number' || maxStock < 0)) {
            return next(createHttpError(400, "Max stock must be a non-negative number"));
        }

        if (minStock !== undefined && maxStock !== undefined && maxStock < minStock) {
            return next(createHttpError(400, "Max stock must be greater than or equal to min stock"));
        }

        // Validate costs
        if (averageCost !== undefined && (typeof averageCost !== 'number' || averageCost < 0)) {
            return next(createHttpError(400, "Average cost must be a non-negative number"));
        }

        if (lastPurchaseCost !== undefined && (typeof lastPurchaseCost !== 'number' || lastPurchaseCost < 0)) {
            return next(createHttpError(400, "Last purchase cost must be a non-negative number"));
        }

        // Create storage item
        const storageItem = new StorageItem({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description ? description.trim() : undefined,
            category: category || "Ingredient",
            unit,
            minStock: minStock || 0,
            maxStock: maxStock || 1000,
            averageCost: averageCost || 0,
            lastPurchaseCost: lastPurchaseCost || 0,
            createdBy: userId && userName ? { userId, userName } : undefined
        });

        await storageItem.save();

        res.status(201).json({
            success: true,
            message: "Storage item created successfully!",
            data: storageItem
        });
    } catch (error) {
        next(error);
    }
};

// Get all storage items
const getStorageItems = async (req, res, next) => {
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
        const [items, totalCount] = await Promise.all([
            StorageItem.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            StorageItem.countDocuments(query)
        ]);

        // Filter by stock status if needed
        let filteredItems = items;
        if (stockStatus && stockStatus !== 'all') {
            filteredItems = items.filter(item => {
                if (stockStatus === 'low') {
                    return item.currentStock <= item.minStock;
                } else if (stockStatus === 'out') {
                    return item.currentStock === 0;
                } else if (stockStatus === 'inStock') {
                    return item.currentStock > item.minStock;
                }
                return true;
            });
        }

        res.status(200).json({
            success: true,
            data: filteredItems,
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

// Get storage item by ID
const getStorageItemById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid storage item ID"));
        }

        const item = await StorageItem.findById(id).lean();

        if (!item) {
            return next(createHttpError(404, "Storage item not found"));
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// Update storage item
const updateStorageItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name,
            code,
            description,
            category,
            unit,
            minStock,
            maxStock,
            averageCost,
            lastPurchaseCost,
            isActive
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid storage item ID"));
        }

        const item = await StorageItem.findById(id);

        if (!item) {
            return next(createHttpError(404, "Storage item not found"));
        }

        // Check if name is being changed and if it conflicts
        if (name && name.trim() !== item.name) {
            const existingItem = await StorageItem.findOne({
                name: name.trim(),
                _id: { $ne: id }
            });
            if (existingItem) {
                return next(createHttpError(400, "Storage item with this name already exists"));
            }
            item.name = name.trim();
        }

        // Check if code is being changed and if it conflicts
        if (code && code.trim().toUpperCase() !== item.code) {
            const existingItem = await StorageItem.findOne({
                code: code.trim().toUpperCase(),
                _id: { $ne: id }
            });
            if (existingItem) {
                return next(createHttpError(400, "Storage item with this code already exists"));
            }
            item.code = code.trim().toUpperCase();
        }

        // Validate unit enum if being changed
        if (unit) {
            const validUnits = ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'box', 'bag'];
            if (!validUnits.includes(unit)) {
                return next(createHttpError(400, `Unit must be one of: ${validUnits.join(', ')}`));
            }
            item.unit = unit;
        }

        // Validate stock levels
        if (minStock !== undefined) {
            if (typeof minStock !== 'number' || minStock < 0) {
                return next(createHttpError(400, "Min stock must be a non-negative number"));
            }
            item.minStock = minStock;
        }

        if (maxStock !== undefined) {
            if (typeof maxStock !== 'number' || maxStock < 0) {
                return next(createHttpError(400, "Max stock must be a non-negative number"));
            }
            item.maxStock = maxStock;
        }

        if (item.minStock > item.maxStock) {
            return next(createHttpError(400, "Max stock must be greater than or equal to min stock"));
        }

        // Validate costs
        if (averageCost !== undefined) {
            if (typeof averageCost !== 'number' || averageCost < 0) {
                return next(createHttpError(400, "Average cost must be a non-negative number"));
            }
            item.averageCost = averageCost;
        }

        if (lastPurchaseCost !== undefined) {
            if (typeof lastPurchaseCost !== 'number' || lastPurchaseCost < 0) {
                return next(createHttpError(400, "Last purchase cost must be a non-negative number"));
            }
            item.lastPurchaseCost = lastPurchaseCost;
        }

        // Update other fields
        if (description !== undefined) item.description = description ? description.trim() : undefined;
        if (category !== undefined) item.category = category;
        if (isActive !== undefined) item.isActive = Boolean(isActive);

        await item.save();

        res.status(200).json({
            success: true,
            message: "Storage item updated successfully!",
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// Delete storage item (hard delete)
const deleteStorageItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid storage item ID"));
        }

        const item = await StorageItem.findByIdAndDelete(id);

        if (!item) {
            return next(createHttpError(404, "Storage item not found"));
        }

        res.status(200).json({
            success: true,
            message: "Storage item deleted successfully!"
        });
    } catch (error) {
        next(error);
    }
};

// Get low stock items
const getLowStockItems = async (req, res, next) => {
    try {
        const items = await StorageItem.find({
            isActive: true,
            $expr: { $lte: ['$currentStock', '$minStock'] }
        })
            .sort({ currentStock: 1 })
            .lean();

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

// Get storage analytics
const getStorageAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter for imports/exports
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.importDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                dateFilter.importDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.importDate.$lte = end;
            }
        }

        // Get all active storage items with their imports and exports
        const items = await StorageItem.find({ isActive: true })
            .sort({ name: 1 })
            .lean();

        // Build export date filter (same structure as import)
        const exportDateFilter = {};
        if (startDate || endDate) {
            exportDateFilter.exportDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                exportDateFilter.exportDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                exportDateFilter.exportDate.$lte = end;
            }
        }

        // Get completed imports and exports within date range
        const importFilter = { 
            status: 'completed',
            ...dateFilter
        };
        const exportFilter = { 
            status: 'completed',
            ...exportDateFilter
        };

        const [imports, exports] = await Promise.all([
            StorageImport.find(importFilter).lean(),
            StorageExport.find(exportFilter).lean()
        ]);

        // Calculate analytics for each item
        const analyticsData = items.map(item => {
            // Calculate total import quantity and cost for this item
            // Handle both populated and unpopulated storageItemId
            const itemImports = imports.filter(imp => {
                let impItemId;
                if (imp.storageItemId && typeof imp.storageItemId === 'object' && imp.storageItemId._id) {
                    // Populated object
                    impItemId = imp.storageItemId._id.toString();
                } else {
                    // ObjectId or string
                    impItemId = imp.storageItemId?.toString() || imp.storageItemId;
                }
                return impItemId === item._id.toString();
            });
            const totalImportQuantity = itemImports.reduce((sum, imp) => sum + (imp.quantity || 0), 0);
            const totalImportCost = itemImports.reduce((sum, imp) => sum + (imp.totalCost || 0), 0);

            // Calculate total export quantity for this item
            // Handle both populated and unpopulated storageItemId
            const itemExports = exports.filter(exp => {
                let expItemId;
                if (exp.storageItemId && typeof exp.storageItemId === 'object' && exp.storageItemId._id) {
                    // Populated object
                    expItemId = exp.storageItemId._id.toString();
                } else {
                    // ObjectId or string
                    expItemId = exp.storageItemId?.toString() || exp.storageItemId;
                }
                return expItemId === item._id.toString();
            });
            const totalExportQuantity = itemExports.reduce((sum, exp) => sum + (exp.quantity || 0), 0);
            
            // Calculate export cost (quantity * averageCost at time of export)
            // Since we don't store historical averageCost, we'll use current averageCost
            const totalExportCost = totalExportQuantity * (item.averageCost || 0);

            // Current stock is already stored in item.currentStock
            // But we can also verify: initial stock + imports - exports
            // For now, we'll use the stored currentStock value
            const currentStock = item.currentStock;
            const isLowStock = currentStock <= item.minStock;

            return {
                _id: item._id,
                name: item.name,
                code: item.code,
                category: item.category,
                unit: item.unit,
                currentStock: currentStock,
                minStock: item.minStock,
                maxStock: item.maxStock,
                averageCost: item.averageCost || 0,
                isLowStock: isLowStock,
                totalImportQuantity: totalImportQuantity,
                totalImportCost: totalImportCost,
                totalExportQuantity: totalExportQuantity,
                totalExportCost: totalExportCost,
                importCount: itemImports.length,
                exportCount: itemExports.length
            };
        });

        // Calculate summary statistics
        const summary = {
            totalItems: items.length,
            lowStockItems: analyticsData.filter(item => item.isLowStock).length,
            totalImportCost: analyticsData.reduce((sum, item) => sum + item.totalImportCost, 0),
            totalExportCost: analyticsData.reduce((sum, item) => sum + item.totalExportCost, 0),
            totalImportQuantity: analyticsData.reduce((sum, item) => sum + item.totalImportQuantity, 0),
            totalExportQuantity: analyticsData.reduce((sum, item) => sum + item.totalExportQuantity, 0)
        };

        res.status(200).json({
            success: true,
            data: {
                summary,
                items: analyticsData
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addStorageItem,
    getStorageItems,
    getStorageItemById,
    updateStorageItem,
    deleteStorageItem,
    getLowStockItems,
    getStorageAnalytics
};
