const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Protein', 'Vegetable', 'Fruit', 'Dairy', 'Grain', 'Spice', 'Oil', 'Sauce', 'Beverage', 'Other'],
        default: 'Other'
    },
    
    // Unit of measurement
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'box', 'bag'],
        default: 'kg'
    },
    
    // Inventory tracking
    inventory: {
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
        reorderPoint: {
            type: Number,
            default: 10,
            min: 0
        }
    },
    
    // Cost tracking
    costs: {
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
        standardCost: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // Storage information
    storage: {
        location: {
            type: String,
            trim: true
        },
        temperature: {
            type: String,
            enum: ['FROZEN', 'CHILLED', 'AMBIENT', 'DRY'],
            default: 'AMBIENT'
        },
        shelfLife: {
            type: Number, // in days
            min: 0
        }
    },
    
    // Supplier information
    suppliers: [{
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor'
        },
        supplierName: {
            type: String,
            trim: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Metadata
    createdBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String
    },
    lastModifiedBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Indexes for performance
ingredientSchema.index({ name: 1 });
ingredientSchema.index({ code: 1 });
ingredientSchema.index({ category: 1 });
ingredientSchema.index({ 'inventory.currentStock': 1 });
ingredientSchema.index({ isActive: 1 });

// Virtual for stock status
ingredientSchema.virtual('stockStatus').get(function() {
    if (this.inventory.currentStock <= 0) return 'OUT_OF_STOCK';
    if (this.inventory.currentStock <= this.inventory.reorderPoint) return 'LOW_STOCK';
    if (this.inventory.currentStock <= this.inventory.minStock) return 'CRITICAL';
    return 'IN_STOCK';
});

// Virtual for needs reorder
ingredientSchema.virtual('needsReorder').get(function() {
    return this.inventory.currentStock <= this.inventory.reorderPoint;
});

ingredientSchema.set('toJSON', { virtuals: true });
ingredientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Ingredient", ingredientSchema);

