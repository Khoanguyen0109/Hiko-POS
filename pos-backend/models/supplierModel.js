const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    code: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true // Allows multiple null values but enforces uniqueness for non-null values
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return !v || /^\S+@\S+\.\S+$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    taxId: {
        type: String,
        trim: true,
        sparse: true // Allows multiple null values but enforces uniqueness for non-null values
    },
    notes: {
        type: String,
        trim: true
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
supplierSchema.index({ name: 1 }, { unique: true });
supplierSchema.index({ code: 1 }, { unique: true, sparse: true });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ taxId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Supplier", supplierSchema);
