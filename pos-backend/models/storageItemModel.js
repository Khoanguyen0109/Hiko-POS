const mongoose = require("mongoose");

const storageItemSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        default: "Ingredient",
        trim: true
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'box', 'bag'],
        default: 'kg'
    },
    currentStock: {
        type: Number,
        default: 0,
        min: 0
    },
    minStock: {
        type: Number,
        default: 0,
        min: 0
    },
    maxStock: {
        type: Number,
        default: 1000,
        min: 0
    },
    averageCost: {
        type: Number,
        default: 0,
        min: 0
    },
    lastPurchaseCost: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String
    }
}, { timestamps: true });

// Indexes
storageItemSchema.index({ store: 1, name: 1 });
storageItemSchema.index({ store: 1, code: 1 });
storageItemSchema.index({ store: 1, isActive: 1 });
storageItemSchema.index({ category: 1 });
storageItemSchema.index({ isActive: 1 });

// Virtual for low stock check
storageItemSchema.virtual('isLowStock').get(function() {
    return this.currentStock <= this.minStock;
});

module.exports = mongoose.model("StorageItem", storageItemSchema);
