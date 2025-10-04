const mongoose = require("mongoose");
const { getCurrentVietnamTime } = require("../utils/dateUtils");

// Spending Category Schema for better organization
const spendingCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: '#3B82F6',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Vendor Schema for tracking suppliers and service providers
const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Main Spending Schema
const spendingSchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    
    // Financial Details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'VND',
        enum: ['VND', 'USD', 'EUR']
    },
    
    // Categorization
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpendingCategory',
        required: true
    },
    
    // Vendor Information
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },
    vendorName: {
        type: String,
        trim: true
    }, // For quick access without population
    
    // Date Information - removed spendingDate and dueDate as requested
    
    // Payment Information
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'other'],
        default: 'cash'
    },
    paymentDate: {
        type: Date
    },
    paymentReference: {
        type: String,
        trim: true
    },
    
    // Receipt/Invoice Information
    receiptNumber: {
        type: String,
        trim: true
    },
    invoiceNumber: {
        type: String,
        trim: true
    },
    
    // Tax Information - removed as requested
    
    // Recurring Spending
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
            default: 'monthly'
        },
        interval: {
            type: Number,
            default: 1,
            min: 1
        },
        endDate: {
            type: Date
        },
        nextDueDate: {
            type: Date
        }
    },
    parentSpendingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Spending'
    }, // For tracking recurring spending instances
    
    // Approval Workflow
    approvalStatus: {
        type: String,
        enum: ['draft', 'pending_approval', 'approved', 'rejected'],
        default: 'approved'
    },
    approvedBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, trim: true },
        approvedAt: { type: Date }
    },
    
    // Attachments
    attachments: [{
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: getCurrentVietnamTime }
    }],
    
    // Tags - removed as part of Additional Information
    
    // Status and Notes
    status: {
        type: String,
        enum: ['active', 'cancelled', 'refunded'],
        default: 'active'
    },
    
    // Audit Trail
    createdBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, trim: true }
    },
    lastModifiedBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, trim: true }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
spendingSchema.index({ spendingDate: -1 });
spendingSchema.index({ category: 1 });
spendingSchema.index({ vendor: 1 });
spendingSchema.index({ paymentStatus: 1 });
spendingSchema.index({ approvalStatus: 1 });
spendingSchema.index({ 'createdBy.userId': 1 });
spendingSchema.index({ createdAt: -1 });
spendingSchema.index({ tags: 1 });
spendingSchema.index({ isRecurring: 1, 'recurringPattern.nextDueDate': 1 });

// Compound indexes for common queries
spendingSchema.index({ spendingDate: -1, category: 1 });
spendingSchema.index({ spendingDate: -1, paymentStatus: 1 });
spendingSchema.index({ vendor: 1, spendingDate: -1 });

// Virtual for total amount including tax
spendingSchema.virtual('totalAmount').get(function() {
    return this.amount + (this.taxAmount || 0);
});

// Virtual for days until due
spendingSchema.virtual('daysUntilDue').get(function() {
    if (!this.dueDate) return null;
    const today = getCurrentVietnamTime();
    const diffTime = this.dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
spendingSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate || this.paymentStatus === 'paid') return false;
    return this.dueDate < getCurrentVietnamTime();
});

// Pre-save middleware to update payment status based on due date
spendingSchema.pre('save', function(next) {
    // Update vendor name for quick access
    if (this.vendor && this.isModified('vendor')) {
        // This would need to be populated in the controller
    }
    
    // Auto-update payment status if overdue
    if (this.dueDate && this.paymentStatus === 'pending' && this.dueDate < getCurrentVietnamTime()) {
        this.paymentStatus = 'overdue';
    }
    
    // Set payment date when status changes to paid
    if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && !this.paymentDate) {
        this.paymentDate = getCurrentVietnamTime();
    }
    
    next();
});

// Static methods for analytics
spendingSchema.statics.getSpendingByCategory = function(startDate, endDate) {
    const matchStage = {
        status: 'active',
        spendingDate: {}
    };
    
    if (startDate) matchStage.spendingDate.$gte = new Date(startDate);
    if (endDate) matchStage.spendingDate.$lte = new Date(endDate);
    
    return this.aggregate([
        { $match: matchStage },
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
                totalTax: { $sum: '$taxAmount' },
                count: { $sum: 1 },
                avgAmount: { $avg: '$amount' }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);
};

spendingSchema.statics.getSpendingByVendor = function(startDate, endDate) {
    const matchStage = {
        status: 'active',
        vendor: { $exists: true },
        spendingDate: {}
    };
    
    if (startDate) matchStage.spendingDate.$gte = new Date(startDate);
    if (endDate) matchStage.spendingDate.$lte = new Date(endDate);
    
    return this.aggregate([
        { $match: matchStage },
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
                totalTax: { $sum: '$taxAmount' },
                count: { $sum: 1 },
                avgAmount: { $avg: '$amount' }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);
};

spendingSchema.statics.getMonthlySpendingTrend = function(months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    return this.aggregate([
        {
            $match: {
                status: 'active',
                spendingDate: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$spendingDate' },
                    month: { $month: '$spendingDate' }
                },
                totalAmount: { $sum: '$amount' },
                totalTax: { $sum: '$taxAmount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
};

// Create models
const SpendingCategory = mongoose.model('SpendingCategory', spendingCategorySchema);
const Vendor = mongoose.model('Vendor', vendorSchema);
const Spending = mongoose.model('Spending', spendingSchema);

module.exports = { Spending, SpendingCategory, Vendor };
