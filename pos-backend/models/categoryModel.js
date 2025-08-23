const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlength: 50
    },
    
    description: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ""
    },
    
    color: {
        type: String,
        required: true,
        default: "#f6b100",
        validate: {
            validator: function(v) {
                // Validate hex color format
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: "Color must be a valid hex color code"
        }
    },
    
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for better query performance
categorySchema.index({ isActive: 1 });
categorySchema.index({ name: 1 });

module.exports = mongoose.model("Category", categorySchema); 