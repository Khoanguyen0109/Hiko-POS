const mongoose = require("mongoose");

// Size variant schema for different sizes of the same dish
const sizeVariantSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true,
        trim: true,
        enum: ['Small', 'Medium', 'Large', 'Extra Large', 'Regular']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    cost: {
        type: Number,
        min: 0,
        default: 0
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { _id: true });

const dishSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Base price - will be used if no size variants exist
    price: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    // Base cost - will be used if no size variants exist
    cost: {
        type: Number,
        min: 0,
        default: 0
    },

    note: {
        type: String,
        trim: true,
        default: ""
    },

    // Image URL for the dish
    image: {
        type: String,
        trim: true,
        default: ""
    },

    // Size variants for dishes that come in different sizes
    sizeVariants: {
        type: [sizeVariantSchema],
        default: []
    },

    // Whether this dish has size variants
    hasSizeVariants: {
        type: Boolean,
        default: false
    },

    // Whether the dish is available
    isAvailable: {
        type: Boolean,
        default: true
    },

    // Compatible toppings for this dish
    compatibleToppings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topping"
    }],

    // Whether this dish supports toppings
    allowToppings: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Middleware to ensure at least one default size variant if hasSizeVariants is true
dishSchema.pre('save', function(next) {
    if (this.hasSizeVariants && this.sizeVariants.length > 0) {
        // Ensure only one default size variant
        const defaultVariants = this.sizeVariants.filter(variant => variant.isDefault);
        if (defaultVariants.length === 0) {
            // Set first variant as default if none is set
            this.sizeVariants[0].isDefault = true;
        } else if (defaultVariants.length > 1) {
            // Keep only the first default, unset others
            this.sizeVariants.forEach((variant, index) => {
                variant.isDefault = index === this.sizeVariants.findIndex(v => v.isDefault);
            });
        }
    }
    next();
});

// Virtual to get the default price (either base price or default variant price)
dishSchema.virtual('defaultPrice').get(function() {
    if (this.hasSizeVariants && this.sizeVariants.length > 0) {
        const defaultVariant = this.sizeVariants.find(variant => variant.isDefault);
        return defaultVariant ? defaultVariant.price : this.sizeVariants[0].price;
    }
    return this.price;
});

// Virtual to get the default cost (either base cost or default variant cost)
dishSchema.virtual('defaultCost').get(function() {
    if (this.hasSizeVariants && this.sizeVariants.length > 0) {
        const defaultVariant = this.sizeVariants.find(variant => variant.isDefault);
        return defaultVariant ? defaultVariant.cost : this.sizeVariants[0].cost;
    }
    return this.cost;
});

module.exports = mongoose.model("Dish", dishSchema); 