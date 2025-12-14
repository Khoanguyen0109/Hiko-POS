const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
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

// Compound index for efficient queries
scheduleSchema.index({ date: 1, shiftTemplate: 1 });
scheduleSchema.index({ year: 1, weekNumber: 1 });
scheduleSchema.index({ "assignedMembers.member": 1, date: 1 });

// Helper function to calculate ISO 8601 week number
function getISOWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNumber;
}

// Helper method to calculate week number
scheduleSchema.pre('save', function(next) {
    if (this.date) {
        const date = new Date(this.date);
        
        // Only set year if not already set
        if (!this.year) {
            this.year = date.getFullYear();
        }
        
        // Only calculate week number if not provided by the client
        // Trust the frontend's calculation since it uses local timezone
        if (!this.weekNumber) {
            // Calculate ISO 8601 week number
            this.weekNumber = getISOWeekNumber(date);
        }
    }
    next();
});

module.exports = mongoose.model("Schedule", scheduleSchema);

