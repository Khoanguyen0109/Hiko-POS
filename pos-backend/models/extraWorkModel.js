const mongoose = require("mongoose");
const { getCurrentVietnamTime } = require("../utils/dateUtils");

const extraWorkSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Member is required"],
        index: true
    },
    
    date: {
        type: Date,
        required: [true, "Date is required"],
        index: true
    },
    
    // Direct duration input in hours (can be positive or negative)
    durationHours: {
        type: Number,
        required: [true, "Duration is required"]
        // Allow negative values for corrections/adjustments
    },
    
    workType: {
        type: String,
        enum: ["overtime", "extra_shift", "emergency", "training", "event", "other"],
        default: "overtime"
    },
    
    description: {
        type: String,
        required: false,
        trim: true
    },
    
    isApproved: {
        type: Boolean,
        default: false
    },
    
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    
    approvedAt: {
        type: Date,
        default: null
    },
    
    isPaid: {
        type: Boolean,
        default: false
    },
    
    paidAt: {
        type: Date,
        default: null
    },
    
    hourlyRate: {
        type: Number,
        default: 0,
        min: [0, "Hourly rate cannot be negative"]
    },
    
    paymentAmount: {
        type: Number,
        default: 0
        // Allow negative values for deductions/adjustments
    },
    
    notes: {
        type: String,
        default: ""
    },
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

// Calculate payment amount before saving
extraWorkSchema.pre('save', function(next) {
    // Calculate payment based on duration and hourly rate
    if (this.hourlyRate !== 0 && this.durationHours !== undefined) {
        this.paymentAmount = Math.round(this.durationHours * this.hourlyRate * 100) / 100;
    } else {
        this.paymentAmount = 0;
    }
    next();
});

// Compound indexes for efficient queries
extraWorkSchema.index({ member: 1, date: 1 });
extraWorkSchema.index({ date: 1, isApproved: 1 });
extraWorkSchema.index({ member: 1, isPaid: 1 });
extraWorkSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ExtraWork", extraWorkSchema);

