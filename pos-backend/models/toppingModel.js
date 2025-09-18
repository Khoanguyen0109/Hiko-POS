const mongoose = require("mongoose");

const toppingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Kem', 'Matcha'],
        default: 'Kem'
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

// Indexes for better query performance
toppingSchema.index({ name: 1 });
toppingSchema.index({ category: 1 });
toppingSchema.index({ isAvailable: 1 });
toppingSchema.index({ price: 1 });

// Virtual for formatted price
toppingSchema.virtual('formattedPrice').get(function() {
    return `$${this.price.toFixed(2)}`;
});

// Method to check if topping is available
toppingSchema.methods.checkAvailability = function() {
    return this.isAvailable;
};

// Static method to get available toppings by category
toppingSchema.statics.getByCategory = function(category) {
    return this.find({ 
        category: category, 
        isAvailable: true 
    }).sort({ name: 1 });
};

// Static method to get all available toppings
toppingSchema.statics.getAvailable = function() {
    return this.find({ 
        isAvailable: true 
    }).sort({ category: 1, name: 1 });
};

module.exports = mongoose.model("Topping", toppingSchema);
