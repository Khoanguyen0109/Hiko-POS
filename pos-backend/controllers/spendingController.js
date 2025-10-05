const createHttpError = require("http-errors");
const { Spending, SpendingCategory, Vendor } = require("../models/spendingModel");
const { default: mongoose } = require("mongoose");
const { getDateRangeVietnam, getCurrentVietnamTime } = require("../utils/dateUtils");

// ==================== SPENDING CRUD OPERATIONS ====================

const addSpending = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            title,
            description,
            amount,
            currency,
            category,
            subcategory,
            vendor,
            vendorName,
            spendingDate,
            dueDate,
            paymentStatus,
            paymentMethod,
            paymentDate,
            paymentReference,
            receiptNumber,
            invoiceNumber,
            taxAmount,
            taxRate,
            isDeductible,
            isRecurring,
            recurringPattern,
            approvalStatus,
            attachments,
            tags,
            notes
        } = req.body;

        // Validate required fields
        if (!title || title.trim().length === 0) {
            return next(createHttpError(400, "Title is required"));
        }

        if (!amount || amount < 0) {
            return next(createHttpError(400, "Valid amount is required"));
        }

        if (!category || !mongoose.Types.ObjectId.isValid(category)) {
            return next(createHttpError(400, "Valid category is required"));
        }

        // Validate vendor if provided
        if (vendor && !mongoose.Types.ObjectId.isValid(vendor)) {
            return next(createHttpError(400, "Invalid vendor ID"));
        }

        // Validate category exists
        const categoryExists = await SpendingCategory.findById(category);
        if (!categoryExists) {
            return next(createHttpError(400, "Category not found"));
        }

        // Validate vendor exists if provided
        let vendorInfo = null;
        if (vendor) {
            vendorInfo = await Vendor.findById(vendor);
            if (!vendorInfo) {
                return next(createHttpError(400, "Vendor not found"));
            }
        }

        // Create spending object
        const spendingData = {
            title: title.trim(),
            description: description?.trim(),
            amount: parseFloat(amount),
            currency: currency || 'VND',
            category,
            subcategory: subcategory?.trim(),
            vendor,
            vendorName: vendorName?.trim() || vendorInfo?.name,
            spendingDate: spendingDate ? new Date(spendingDate) : getCurrentVietnamTime(),
            dueDate: dueDate ? new Date(dueDate) : null,
            paymentStatus: paymentStatus || 'pending',
            paymentMethod: paymentMethod || 'cash',
            paymentDate: paymentDate ? new Date(paymentDate) : null,
            paymentReference: paymentReference?.trim(),
            receiptNumber: receiptNumber?.trim(),
            invoiceNumber: invoiceNumber?.trim(),
            taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
            taxRate: taxRate ? parseFloat(taxRate) : 0,
            isDeductible: isDeductible !== undefined ? isDeductible : true,
            isRecurring: isRecurring || false,
            recurringPattern: isRecurring ? recurringPattern : undefined,
            approvalStatus: approvalStatus || 'approved',
            attachments: attachments || [],
            tags: tags || [],
            notes: notes?.trim(),
            createdBy: userId && userName ? { userId, userName } : undefined
        };

        const spending = new Spending(spendingData);
        await spending.save();

        // Populate references for response
        await spending.populate([
            { path: 'category', select: 'name description color' },
            { path: 'vendor', select: 'name contactPerson phone email' }
        ]);

        res.status(201).json({
            success: true,
            message: "Spending record created successfully",
            data: spending
        });
    } catch (error) {
        next(error);
    }
};

const getSpendingById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid spending ID"));
        }

        const spending = await Spending.findById(id)
            .populate('category', 'name description color')
            .populate('vendor', 'name contactPerson phone email address')
            .populate('createdBy.userId', 'name email')
            .populate('lastModifiedBy.userId', 'name email')
            .populate('approvedBy.userId', 'name email');

        if (!spending) {
            return next(createHttpError(404, "Spending record not found"));
        }

        res.status(200).json({
            success: true,
            data: spending
        });
    } catch (error) {
        next(error);
    }
};

const getSpending = async (req, res, next) => {
    try {
        const {
            startDate,
            endDate,
            category,
            vendor,
            paymentStatus,
            approvalStatus,
            status,
            tags,
            isRecurring,
            page = 1,
            limit = 50,
            sortBy = 'spendingDate',
            sortOrder = 'desc'
        } = req.query;

        // Build query object
        let query = {};

        // Date filtering using Vietnam timezone
        if (startDate || endDate) {
            query.spendingDate = {};
            const { start, end } = getDateRangeVietnam(startDate, endDate);
            
            if (start) query.spendingDate.$gte = start;
            if (end) query.spendingDate.$lte = end;
        }

        // Category filtering
        if (category && category !== 'all') {
            query.category = category;
        }

        // Vendor filtering
        if (vendor && vendor !== 'all') {
            query.vendor = vendor;
        }

        // Payment status filtering
        if (paymentStatus && paymentStatus !== 'all') {
            query.paymentStatus = paymentStatus;
        }

        // Approval status filtering
        if (approvalStatus && approvalStatus !== 'all') {
            query.approvalStatus = approvalStatus;
        }

        // Status filtering
        if (status && status !== 'all') {
            query.status = status;
        }

        // Tags filtering
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
            query.tags = { $in: tagArray };
        }

        // Recurring filtering
        if (isRecurring !== undefined) {
            query.isRecurring = isRecurring === 'true';
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const [spending, totalCount] = await Promise.all([
            Spending.find(query)
                .populate('category', 'name description color')
                .populate('vendor', 'name contactPerson phone')
                .populate('createdBy.userId', 'name')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Spending.countDocuments(query)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            data: spending,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNextPage,
                hasPrevPage,
                limit: limitNum
            },
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                category: category || 'all',
                vendor: vendor || 'all',
                paymentStatus: paymentStatus || 'all',
                approvalStatus: approvalStatus || 'all',
                status: status || 'all',
                tags: tags || null,
                isRecurring: isRecurring || null
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateSpending = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { _id: userId, name: userName } = req.user || {};
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid spending ID"));
        }

        // Get current spending record
        const currentSpending = await Spending.findById(id);
        if (!currentSpending) {
            return next(createHttpError(404, "Spending record not found"));
        }

        // Validate category if being updated
        if (updateData.category && !mongoose.Types.ObjectId.isValid(updateData.category)) {
            return next(createHttpError(400, "Invalid category ID"));
        }

        if (updateData.category) {
            const categoryExists = await SpendingCategory.findById(updateData.category);
            if (!categoryExists) {
                return next(createHttpError(400, "Category not found"));
            }
        }

        // Validate vendor if being updated
        if (updateData.vendor && !mongoose.Types.ObjectId.isValid(updateData.vendor)) {
            return next(createHttpError(400, "Invalid vendor ID"));
        }

        if (updateData.vendor) {
            const vendorExists = await Vendor.findById(updateData.vendor);
            if (!vendorExists) {
                return next(createHttpError(400, "Vendor not found"));
            }
        }

        // Add audit trail
        updateData.lastModifiedBy = userId && userName ? { userId, userName } : undefined;

        // Update spending record
        const spending = await Spending.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate([
            { path: 'category', select: 'name description color' },
            { path: 'vendor', select: 'name contactPerson phone email' }
        ]);

        res.status(200).json({
            success: true,
            message: "Spending record updated successfully",
            data: spending
        });
    } catch (error) {
        next(error);
    }
};

const deleteSpending = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid spending ID"));
        }

        const spending = await Spending.findByIdAndDelete(id);
        if (!spending) {
            return next(createHttpError(404, "Spending record not found"));
        }

        res.status(200).json({
            success: true,
            message: "Spending record deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// ==================== CATEGORY OPERATIONS ====================

const addSpendingCategory = async (req, res, next) => {
    try {
        const { name, description, color } = req.body;

        if (!name || name.trim().length === 0) {
            return next(createHttpError(400, "Category name is required"));
        }

        const categoryData = {
            name: name.trim(),
            description: description?.trim(),
            color: color || '#3B82F6'
        };

        const category = new SpendingCategory(categoryData);
        await category.save();

        res.status(201).json({
            success: true,
            message: "Spending category created successfully",
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(createHttpError(400, "Category name already exists"));
        }
        next(error);
    }
};

const getSpendingCategories = async (req, res, next) => {
    try {
        const { isActive } = req.query;
        
        let query = {};
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const categories = await SpendingCategory.find(query).sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

const updateSpendingCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid category ID"));
        }

        const category = await SpendingCategory.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!category) {
            return next(createHttpError(404, "Category not found"));
        }

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(createHttpError(400, "Category name already exists"));
        }
        next(error);
    }
};

const deleteSpendingCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid category ID"));
        }

        // Check if category is being used
        const spendingCount = await Spending.countDocuments({ category: id });
        if (spendingCount > 0) {
            return next(createHttpError(400, `Cannot delete category. It is being used by ${spendingCount} spending records.`));
        }

        const category = await SpendingCategory.findByIdAndDelete(id);
        if (!category) {
            return next(createHttpError(404, "Category not found"));
        }

        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// ==================== VENDOR OPERATIONS ====================

const addVendor = async (req, res, next) => {
    try {
        const {
            name,
            contactPerson,
            phone,
            email,
            address,
            taxId,
            paymentTerms,
            customPaymentTerms,
            notes
        } = req.body;

        if (!name || name.trim().length === 0) {
            return next(createHttpError(400, "Vendor name is required"));
        }

        const vendorData = {
            name: name.trim(),
            contactPerson: contactPerson?.trim(),
            phone: phone?.trim(),
            email: email?.trim(),
            address,
            taxId: taxId?.trim(),
            paymentTerms: paymentTerms || 'immediate',
            customPaymentTerms: customPaymentTerms?.trim(),
            notes: notes?.trim()
        };

        const vendor = new Vendor(vendorData);
        await vendor.save();

        res.status(201).json({
            success: true,
            message: "Vendor created successfully",
            data: vendor
        });
    } catch (error) {
        next(error);
    }
};

const getVendors = async (req, res, next) => {
    try {
        const { isActive, search } = req.query;
        
        let query = {};
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const vendors = await Vendor.find(query).sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: vendors
        });
    } catch (error) {
        next(error);
    }
};

const getVendorById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid vendor ID"));
        }

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return next(createHttpError(404, "Vendor not found"));
        }

        res.status(200).json({
            success: true,
            data: vendor
        });
    } catch (error) {
        next(error);
    }
};

const updateVendor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid vendor ID"));
        }

        const vendor = await Vendor.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!vendor) {
            return next(createHttpError(404, "Vendor not found"));
        }

        res.status(200).json({
            success: true,
            message: "Vendor updated successfully",
            data: vendor
        });
    } catch (error) {
        next(error);
    }
};

const deleteVendor = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid vendor ID"));
        }

        // Check if vendor is being used
        const spendingCount = await Spending.countDocuments({ vendor: id });
        if (spendingCount > 0) {
            return next(createHttpError(400, `Cannot delete vendor. It is being used by ${spendingCount} spending records.`));
        }

        const vendor = await Vendor.findByIdAndDelete(id);
        if (!vendor) {
            return next(createHttpError(404, "Vendor not found"));
        }

        res.status(200).json({
            success: true,
            message: "Vendor deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// ==================== ANALYTICS OPERATIONS ====================

const getSpendingAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate, period = 'month' } = req.query;
        
        // Date range setup
        const { start, end } = getDateRangeVietnam(startDate, endDate);
        const dateFilter = {};
        if (start) dateFilter.$gte = start;
        if (end) dateFilter.$lte = end;

        // Execute multiple analytics queries in parallel
        const [
            totalSpending,
            spendingByCategory,
            spendingByVendor,
            monthlyTrend,
            paymentStatusBreakdown,
            overdueSpending
        ] = await Promise.all([
            // Total spending summary
            Spending.aggregate([
                { $match: { status: 'active', createdAt: dateFilter } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        totalTax: { $sum: '$taxAmount' },
                        totalWithTax: { $sum: { $add: ['$amount', '$taxAmount'] } },
                        count: { $sum: 1 },
                        avgAmount: { $avg: '$amount' }
                    }
                }
            ]),

            // Spending by category
            Spending.getSpendingByCategory(start, end),

            // Spending by vendor
            Spending.getSpendingByVendor(start, end),

            // Monthly trend
            Spending.getMonthlySpendingTrend(12),

            // Payment status breakdown
            Spending.aggregate([
                { $match: { status: 'active', createdAt: dateFilter } },
                {
                    $group: {
                        _id: '$paymentStatus',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Overdue spending
            Spending.find({
                status: 'active',
                paymentStatus: { $in: ['pending', 'overdue'] },
                dueDate: { $lt: getCurrentVietnamTime() }
            })
            .populate('category', 'name')
            .populate('vendor', 'name')
            .sort({ dueDate: 1 })
            .limit(10)
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: totalSpending[0] || {
                    totalAmount: 0,
                    totalTax: 0,
                    totalWithTax: 0,
                    count: 0,
                    avgAmount: 0
                },
                spendingByCategory,
                spendingByVendor,
                monthlyTrend,
                paymentStatusBreakdown,
                overdueSpending,
                period: {
                    startDate: start,
                    endDate: end,
                    period
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const getSpendingDashboard = async (req, res, next) => {
    try {
        const today = getCurrentVietnamTime();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [
            monthlyStats,
            yearlyStats,
            recentSpending,
            upcomingPayments,
            topCategories,
            topVendors
        ] = await Promise.all([
            // Monthly statistics
            Spending.aggregate([
                {
                    $match: {
                        status: 'active',
                        createdAt: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        totalTax: { $sum: '$taxAmount' },
                        count: { $sum: 1 },
                        paidAmount: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0]
                            }
                        },
                        pendingAmount: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0]
                            }
                        }
                    }
                }
            ]),

            // Yearly statistics
            Spending.aggregate([
                {
                    $match: {
                        status: 'active',
                        createdAt: { $gte: startOfYear }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        totalTax: { $sum: '$taxAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Recent spending (last 10)
            Spending.find({ status: 'active' })
                .populate('category', 'name color')
                .populate('vendor', 'name')
                .sort({ createdAt: -1 })
                .limit(10),

            // Upcoming payments (next 30 days)
            Spending.find({
                status: 'active',
                paymentStatus: { $in: ['pending', 'overdue'] },
                dueDate: {
                    $gte: today,
                    $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
                }
            })
            .populate('category', 'name')
            .populate('vendor', 'name')
            .sort({ dueDate: 1 })
            .limit(10),

            // Top 5 categories this month
            Spending.aggregate([
                {
                    $match: {
                        status: 'active',
                        createdAt: { $gte: startOfMonth }
                    }
                },
                {
                    $lookup: {
                        from: 'spendingcategories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'categoryInfo'
                    }
                },
                { $unwind: '$categoryInfo' },
                {
                    $group: {
                        _id: '$category',
                        categoryName: { $first: '$categoryInfo.name' },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } },
                { $limit: 5 }
            ]),

            // Top 5 vendors this month
            Spending.aggregate([
                {
                    $match: {
                        status: 'active',
                        vendor: { $exists: true },
                        createdAt: { $gte: startOfMonth }
                    }
                },
                {
                    $lookup: {
                        from: 'vendors',
                        localField: 'vendor',
                        foreignField: '_id',
                        as: 'vendorInfo'
                    }
                },
                { $unwind: '$vendorInfo' },
                {
                    $group: {
                        _id: '$vendor',
                        vendorName: { $first: '$vendorInfo.name' },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } },
                { $limit: 5 }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                monthlyStats: monthlyStats[0] || {
                    totalAmount: 0,
                    totalTax: 0,
                    count: 0,
                    paidAmount: 0,
                    pendingAmount: 0
                },
                yearlyStats: yearlyStats[0] || {
                    totalAmount: 0,
                    totalTax: 0,
                    count: 0
                },
                recentSpending,
                upcomingPayments,
                topCategories,
                topVendors
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Spending CRUD
    addSpending,
    getSpendingById,
    getSpending,
    updateSpending,
    deleteSpending,
    
    // Category operations
    addSpendingCategory,
    getSpendingCategories,
    updateSpendingCategory,
    deleteSpendingCategory,
    
    // Vendor operations
    addVendor,
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
    
    // Analytics
    getSpendingAnalytics,
    getSpendingDashboard
};
