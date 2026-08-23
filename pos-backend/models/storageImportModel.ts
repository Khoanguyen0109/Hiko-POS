// @ts-nocheck
import mongoose from "mongoose";

export const STORAGE_IMPORT_SOURCES = ["supplier", "from_store"] as const;

const storageImportSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    importNumber: {
        type: String,
        required: true,
        trim: true
    },
    storageItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StorageItem',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true,
        trim: true
    },
    unitCost: {
        type: Number,
        required: true,
        min: 0
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    supplierName: {
        type: String,
        trim: true
    },
    supplierInvoice: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        enum: STORAGE_IMPORT_SOURCES,
        default: "supplier"
    },
    sourceStore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
    sourceStoreName: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    spendingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Spending'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    importedBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String
    },
    importDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes
storageImportSchema.index({ importNumber: 1 }, { unique: true });
storageImportSchema.index({ storageItemId: 1 });
storageImportSchema.index({ supplierId: 1 });
storageImportSchema.index({ source: 1 });
storageImportSchema.index({ sourceStore: 1 });
storageImportSchema.index({ importDate: 1 });
storageImportSchema.index({ store: 1, importDate: 1 });
storageImportSchema.index({ status: 1 });
storageImportSchema.index({ spendingId: 1 });

// Pre-save middleware to auto-calculate totalCost
storageImportSchema.pre('save', function(next) {
    if (this.isModified('quantity') || this.isModified('unitCost')) {
        this.totalCost = this.quantity * this.unitCost;
    }
    next();
});

// Static method to generate unique import number
storageImportSchema.statics.generateImportNumber = async function() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const importNumber = `IMP-${dateStr}-${randomStr}`;
    
    // Check if exists, regenerate if needed
    const exists = await this.findOne({ importNumber });
    if (exists) {
        return this.generateImportNumber(); // Recursive call if collision
    }
    
    return importNumber;
};

export default mongoose.model("StorageImport", storageImportSchema);