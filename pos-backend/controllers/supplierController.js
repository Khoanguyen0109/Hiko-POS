const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Supplier = require("../models/supplierModel");
const StorageImport = require("../models/storageImportModel");

// Add supplier
const addSupplier = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const { name, code, email, phone, address, taxId, notes } = req.body;

        // Validate required fields
        if (!name || name.trim().length === 0) {
            return next(createHttpError(400, "Name is required"));
        }

        if (name.trim().length < 2) {
            return next(createHttpError(400, "Name must be at least 2 characters"));
        }

        // Check if supplier with same name exists
        const existingSupplier = await Supplier.findOne({
            name: name.trim()
        });

        if (existingSupplier) {
            return next(createHttpError(400, "Supplier with this name already exists"));
        }

        // Check if code is provided and unique
        if (code && code.trim()) {
            const existingCode = await Supplier.findOne({
                code: code.trim().toUpperCase()
            });
            if (existingCode) {
                return next(createHttpError(400, "Supplier with this code already exists"));
            }
        }

        // Check if taxId is provided and unique
        if (taxId && taxId.trim()) {
            const existingTaxId = await Supplier.findOne({
                taxId: taxId.trim()
            });
            if (existingTaxId) {
                return next(createHttpError(400, "Supplier with this tax ID already exists"));
            }
        }

        // Validate email format if provided
        if (email && email.trim()) {
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email.trim())) {
                return next(createHttpError(400, "Invalid email format"));
            }
        }

        // Create supplier
        const supplier = new Supplier({
            name: name.trim(),
            code: code ? code.trim().toUpperCase() : undefined,
            email: email ? email.trim().toLowerCase() : undefined,
            phone: phone ? phone.trim() : undefined,
            address: address ? address.trim() : undefined,
            taxId: taxId ? taxId.trim() : undefined,
            notes: notes ? notes.trim() : undefined,
            createdBy: userId && userName ? { userId, userName } : undefined
        });

        await supplier.save();

        res.status(201).json({
            success: true,
            message: "Supplier created successfully!",
            data: supplier
        });
    } catch (error) {
        next(error);
    }
};

// Get all suppliers
const getSuppliers = async (req, res, next) => {
    try {
        const {
            isActive,
            search,
            page = 1,
            limit = 50,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        let query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
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
        const [suppliers, totalCount] = await Promise.all([
            Supplier.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Supplier.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: suppliers,
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

// Get active suppliers only (for dropdowns)
const getActiveSuppliers = async (req, res, next) => {
    try {
        const suppliers = await Supplier.find({ isActive: true })
            .select('name code email phone')
            .sort({ name: 1 })
            .lean();

        res.status(200).json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        next(error);
    }
};

// Get supplier by ID
const getSupplierById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid supplier ID"));
        }

        const supplier = await Supplier.findById(id).lean();

        if (!supplier) {
            return next(createHttpError(404, "Supplier not found"));
        }

        res.status(200).json({
            success: true,
            data: supplier
        });
    } catch (error) {
        next(error);
    }
};

// Update supplier
const updateSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, code, email, phone, address, taxId, notes, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid supplier ID"));
        }

        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return next(createHttpError(404, "Supplier not found"));
        }

        // Check if name is being changed and if it conflicts
        if (name && name.trim() !== supplier.name) {
            const existingSupplier = await Supplier.findOne({
                name: name.trim(),
                _id: { $ne: id }
            });
            if (existingSupplier) {
                return next(createHttpError(400, "Supplier with this name already exists"));
            }
            supplier.name = name.trim();
        }

        // Check if code is being changed and if it conflicts
        if (code !== undefined) {
            const codeValue = code ? code.trim().toUpperCase() : undefined;
            if (codeValue !== supplier.code) {
                const existingCode = await Supplier.findOne({
                    code: codeValue,
                    _id: { $ne: id }
                });
                if (existingCode) {
                    return next(createHttpError(400, "Supplier with this code already exists"));
                }
                supplier.code = codeValue;
            }
        }

        // Check if taxId is being changed and if it conflicts
        if (taxId !== undefined) {
            const taxIdValue = taxId ? taxId.trim() : undefined;
            if (taxIdValue !== supplier.taxId) {
                const existingTaxId = await Supplier.findOne({
                    taxId: taxIdValue,
                    _id: { $ne: id }
                });
                if (existingTaxId) {
                    return next(createHttpError(400, "Supplier with this tax ID already exists"));
                }
                supplier.taxId = taxIdValue;
            }
        }

        // Validate email format if provided
        if (email !== undefined && email && email.trim()) {
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email.trim())) {
                return next(createHttpError(400, "Invalid email format"));
            }
            supplier.email = email.trim().toLowerCase();
        } else if (email === null || email === '') {
            supplier.email = undefined;
        }

        // Update other fields
        if (phone !== undefined) supplier.phone = phone ? phone.trim() : undefined;
        if (address !== undefined) supplier.address = address ? address.trim() : undefined;
        if (notes !== undefined) supplier.notes = notes ? notes.trim() : undefined;
        if (isActive !== undefined) supplier.isActive = Boolean(isActive);

        await supplier.save();

        res.status(200).json({
            success: true,
            message: "Supplier updated successfully!",
            data: supplier
        });
    } catch (error) {
        next(error);
    }
};

// Delete supplier (soft delete)
const deleteSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid supplier ID"));
        }

        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return next(createHttpError(404, "Supplier not found"));
        }

        // Check if supplier has any imports
        const importCount = await StorageImport.countDocuments({
            supplierId: id,
            status: { $ne: 'cancelled' }
        });

        if (importCount > 0) {
            return next(createHttpError(400, `Cannot delete supplier. Supplier has ${importCount} import record(s). Please deactivate instead.`));
        }

        // Soft delete by setting isActive to false
        supplier.isActive = false;
        await supplier.save();

        res.status(200).json({
            success: true,
            message: "Supplier deleted successfully!"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addSupplier,
    getSuppliers,
    getActiveSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
