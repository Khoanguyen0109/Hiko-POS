import mongoose from "mongoose";
import { getISOWeek } from "../utils/dateUtils.js";

const scheduleSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: [true, "Date is required"],
        index: true
    },
    
    shiftTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShiftTemplate",
        required: [true, "Shift template is required"]
    },
    
    assignedMembers: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["scheduled", "confirmed", "completed", "absent", "cancelled"],
            default: "scheduled"
        },
        notes: {
            type: String,
            default: ""
        },
        // Clock in/out times (actual work times)
        clockIn: {
            type: Date,
            default: null
        },
        clockOut: {
            type: Date,
            default: null
        }
    }],
    
    // Week information for easy querying
    weekNumber: {
        type: Number,
        required: true
    },
    
    year: {
        type: Number,
        required: true
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

// Compound indexes for efficient queries
scheduleSchema.index({ store: 1, date: 1 });
scheduleSchema.index({ store: 1, year: 1, weekNumber: 1 });
scheduleSchema.index({ date: 1, shiftTemplate: 1 });
scheduleSchema.index({ year: 1, weekNumber: 1 });
scheduleSchema.index({ "assignedMembers.member": 1, date: 1 });

// Set year and weekNumber from ISO 8601 when not provided (single source of truth)
scheduleSchema.pre("save", function (next) {
    if (this.date && (!this.year || !this.weekNumber)) {
        const { year, weekNumber } = getISOWeek(this.date);
        if (!this.year) this.year = year;
        if (!this.weekNumber) this.weekNumber = weekNumber;
    }
    next();
});

export default mongoose.model("Schedule", scheduleSchema);