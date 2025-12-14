const mongoose = require("mongoose");

const shiftTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Shift name is required"],
        unique: true,
        trim: true
        // e.g., "Morning Shift", "Afternoon Shift", "Evening Shift"
    },
    
    shortName: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
        // e.g., "MORNING", "AFTERNOON", "EVENING"
    },
    
    startTime: {
        type: String,
        required: [true, "Start time is required"],
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Start time must be in HH:MM format"
        }
        // Format: "07:00", "12:30", "17:30"
    },
    
    endTime: {
        type: String,
        required: [true, "End time is required"],
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "End time must be in HH:MM format"
        }
        // Format: "12:30", "17:30", "22:30"
    },
    
    color: {
        type: String,
        default: "#f6b100"
        // Color code for UI display
    },
    
    description: {
        type: String,
        default: ""
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Calculated duration in hours
    durationHours: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate duration before saving
shiftTemplateSchema.pre('save', function(next) {
    if (this.startTime && this.endTime) {
        const [startHour, startMin] = this.startTime.split(':').map(Number);
        const [endHour, endMin] = this.endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        this.durationHours = (endMinutes - startMinutes) / 60;
    }
    next();
});

module.exports = mongoose.model("ShiftTemplate", shiftTemplateSchema);

