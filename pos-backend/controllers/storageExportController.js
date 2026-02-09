const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const StorageExport = require("../models/storageExportModel");
const StorageItem = require("../models/storageItemModel");

// Create export record
const createStorageExport = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            storageItemId,
            quantity,
            reason,
            notes
        } = req.body;

        // Validate required fields
        if (!storageItemId || !mongoose.Types.ObjectId.isValid(storageItemId)) {
            return next(createHttpError(400, "Valid storage item ID is required"));
        }

        if (!quantity || quantity <= 0) {
            return next(createHttpError(400, "Quantity must be greater than 0"));
        }

        if (!reason) {
            return next(createHttpError(400, "Reason is required"));
        }

        const validReasons = ['production', 'waste', 'damage', 'theft', 'transfer', 'other'];
        if (!validReasons.includes(reason)) {
            return next(createHttpError(400, `Reason must be one of: ${validReasons.join(', ')}`));
        }

        // Validate storage item exists and is active
        const storageItem = await StorageItem.findById(storageItemId);
        if (!storageItem) {
            return next(createHttpError(404, "Storage item not found"));
        }
        if (!storageItem.isActive) {
            return next(createHttpError(400, "Storage item is not active"));
        }

        // Validate sufficient stock
        if (storageItem.currentStock < quantity) {
            return next(createHttpError(400, 
                `Insufficient stock available. Current stock: ${storageItem.currentStock}${storageItem.unit}, Required: ${quantity}${storageItem.unit}`
            ));
        }

        // Generate export number
        const exportNumber = await StorageExport.generateExportNumber();

        // Create export record
        const storageExport = new StorageExport({
            exportNumber,
            storageItemId,
            quantity,
            unit: storageItem.unit,
            reason,
            notes: notes || undefined,
            status: 'completed', // Auto-complete on creation
            exportedBy: userId && userName ? { userId, userName } : undefined,
            exportDate: new Date()
        });
        await storageExport.save();

        // Update storage item stock
        storageItem.currentStock -= quantity;
        await storageItem.save();

        // Populate references for response
        await storageExport.populate([
            { path: 'storageItemId', select: 'name code unit currentStock' },
            { path: 'exportedBy.userId', select: 'name' }
        ]);

        res.status(201).json({
            success: true,
            message: "Export created successfully!",
            data: storageExport
        });
    } catch (error) {
        next(error);
    }
};

// Get all export records
const getStorageExports = async (req, res, next) => {
    try {
        const {
            storageItemId,
            status,
            reason,
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

        if (status) {
            query.status = status;
        }

        if (reason) {
            query.reason = reason;
        }

        if (startDate || endDate) {
            query.exportDate = {};
            if (startDate) {
                query.exportDate.$gte = new Date(startDate);
            }
            if (endDate) {
                query.exportDate.$lte = new Date(endDate);
            }
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const [exports, totalCount] = await Promise.all([
            StorageExport.find(query)
                .populate('storageItemId', 'name code unit')
                .populate('exportedBy.userId', 'name')
                .sort({ exportDate: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            StorageExport.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: exports,
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

// Get export record by ID
const getStorageExportById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid export ID"));
        }

        const exportRecord = await StorageExport.findById(id)
            .populate('storageItemId')
            .populate('exportedBy.userId', 'name')
            .lean();

        if (!exportRecord) {
            return next(createHttpError(404, "Export record not found"));
        }

        res.status(200).json({
            success: true,
            data: exportRecord
        });
    } catch (error) {
        next(error);
    }
};

// Update export record
const updateStorageExport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            quantity,
            reason,
            notes,
            status
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid export ID"));
        }

        const exportRecord = await StorageExport.findById(id);
        if (!exportRecord) {
            return next(createHttpError(404, "Export record not found"));
        }

        // Can only update pending exports
        if (exportRecord.status !== 'pending' && status !== 'cancelled') {
            return next(createHttpError(400, "Can only update pending exports or cancel completed exports"));
        }

        const storageItem = await StorageItem.findById(exportRecord.storageItemId);
        if (!storageItem) {
            return next(createHttpError(404, "Storage item not found"));
        }

        // Handle status change to cancelled
        if (status === 'cancelled' && exportRecord.status === 'completed') {
            // Reverse stock changes
            storageItem.currentStock += exportRecord.quantity;
            await storageItem.save();

            exportRecord.status = 'cancelled';
            await exportRecord.save();

            return res.status(200).json({
                success: true,
                message: "Export cancelled successfully!",
                data: exportRecord
            });
        }

        // Update quantity if provided
        if (quantity !== undefined && quantity !== exportRecord.quantity) {
            if (quantity <= 0) {
                return next(createHttpError(400, "Quantity must be greater than 0"));
            }

            // If status is completed, need to adjust stock
            if (exportRecord.status === 'completed') {
                const stockDifference = quantity - exportRecord.quantity;
                const newStock = storageItem.currentStock - stockDifference;
                
                if (newStock < 0) {
                    return next(createHttpError(400, 
                        `Insufficient stock available. Current stock: ${storageItem.currentStock}${storageItem.unit}, Cannot export: ${quantity}${storageItem.unit}`
                    ));
                }
                storageItem.currentStock = newStock;
                await storageItem.save();
            } else {
                // If pending, validate stock availability
                if (storageItem.currentStock < quantity) {
                    return next(createHttpError(400, 
                        `Insufficient stock available. Current stock: ${storageItem.currentStock}${storageItem.unit}, Required: ${quantity}${storageItem.unit}`
                    ));
                }
            }
            exportRecord.quantity = quantity;
        }

        // Update reason if provided
        if (reason) {
            const validReasons = ['production', 'waste', 'damage', 'theft', 'transfer', 'other'];
            if (!validReasons.includes(reason)) {
                return next(createHttpError(400, `Reason must be one of: ${validReasons.join(', ')}`));
            }
            exportRecord.reason = reason;
        }

        if (notes !== undefined) {
            exportRecord.notes = notes ? notes.trim() : undefined;
        }

        // Handle status change to completed
        if (status && status === 'completed' && exportRecord.status === 'pending') {
            // Validate stock availability
            if (storageItem.currentStock < exportRecord.quantity) {
                return next(createHttpError(400, 
                    `Insufficient stock available. Current stock: ${storageItem.currentStock}${storageItem.unit}, Required: ${exportRecord.quantity}${storageItem.unit}`
                ));
            }

            // Update stock
            storageItem.currentStock -= exportRecord.quantity;
            await storageItem.save();

            exportRecord.status = 'completed';
        } else if (status && status !== exportRecord.status) {
            exportRecord.status = status;
        }

        await exportRecord.save();

        await exportRecord.populate([
            { path: 'storageItemId', select: 'name code unit currentStock' },
            { path: 'exportedBy.userId', select: 'name' }
        ]);

        res.status(200).json({
            success: true,
            message: "Export updated successfully!",
            data: exportRecord
        });
    } catch (error) {
        next(error);
    }
};

// Cancel export record
const cancelStorageExport = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid export ID"));
        }

        const exportRecord = await StorageExport.findById(id);
        if (!exportRecord) {
            return next(createHttpError(404, "Export record not found"));
        }

        if (exportRecord.status === 'cancelled') {
            return next(createHttpError(400, "Export is already cancelled"));
        }

        const storageItem = await StorageItem.findById(exportRecord.storageItemId);
        if (!storageItem) {
            return next(createHttpError(404, "Storage item not found"));
        }

        // Reverse stock changes if export was completed
        if (exportRecord.status === 'completed') {
            storageItem.currentStock += exportRecord.quantity;
            await storageItem.save();
        }

        exportRecord.status = 'cancelled';
        await exportRecord.save();

        res.status(200).json({
            success: true,
            message: "Export cancelled successfully!",
            data: exportRecord
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createStorageExport,
    getStorageExports,
    getStorageExportById,
    updateStorageExport,
    cancelStorageExport
};
