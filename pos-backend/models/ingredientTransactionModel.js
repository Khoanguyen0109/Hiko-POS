const mongoose = require("mongoose");

const ingredientTransactionSchema = new mongoose.Schema({
    transactionNumber: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['IMPORT', 'EXPORT', 'ADJUSTMENT', 'WASTE'],
        default: 'IMPORT'
    },
    
    ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
    },
    
    // Transaction details
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    unitCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    
    // Inventory levels
    stockBefore: {
        type: Number,
        required: true,
        min: 0
    },
    stockAfter: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Import specific
    importDetails: {
        purchaseOrderNumber: String,
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor'
        },
        supplierName: String,
        batchNumber: String,
        expiryDate: Date,
        qualityGrade: {
            type: String,
            enum: ['A', 'B', 'C']
        }
    },
    
    // Export specific (for dishes)
    exportDetails: {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        dishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish'
        },
        dishName: String,
        reason: {
            type: String,
            enum: ['PRODUCTION', 'WASTE', 'DAMAGE', 'THEFT', 'OTHER'],
            default: 'PRODUCTION'
        }
    },
    
    // Adjustment/Waste specific
    adjustmentDetails: {
        reason: String,
        approvedBy: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            userName: String
        }
    },
    
    // Transaction metadata
    transactionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
        default: 'COMPLETED'
    },
    
    // Tracking
    createdBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String
    },
    notes: String
}, { timestamps: true });

// Indexes
ingredientTransactionSchema.index({ ingredientId: 1, transactionDate: -1 });
ingredientTransactionSchema.index({ type: 1, transactionDate: -1 });
ingredientTransactionSchema.index({ 'exportDetails.orderId': 1 });
ingredientTransactionSchema.index({ transactionNumber: 1 });

module.exports = mongoose.model("IngredientTransaction", ingredientTransactionSchema);

