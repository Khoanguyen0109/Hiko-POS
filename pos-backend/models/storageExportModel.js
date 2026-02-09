const mongoose = require("mongoose");

const storageExportSchema = new mongoose.Schema({
    exportNumber: {
        type: String,
        required: true,
        unique: true,
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
    reason: {
        type: String,
        required: true,
        enum: ['production', 'waste', 'damage', 'theft', 'transfer', 'other'],
        default: 'production'
    },
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    exportedBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String
    },
    exportDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes
storageExportSchema.index({ exportNumber: 1 }, { unique: true });
storageExportSchema.index({ storageItemId: 1 });
storageExportSchema.index({ exportDate: 1 });
storageExportSchema.index({ status: 1 });
storageExportSchema.index({ reason: 1 });

// Static method to generate unique export number
storageExportSchema.statics.generateExportNumber = async function() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const exportNumber = `EXP-${dateStr}-${randomStr}`;
    
    // Check if exists, regenerate if needed
    const exists = await this.findOne({ exportNumber });
    if (exists) {
        return this.generateExportNumber(); // Recursive call if collision
    }
    
    return exportNumber;
};

module.exports = mongoose.model("StorageExport", storageExportSchema);
