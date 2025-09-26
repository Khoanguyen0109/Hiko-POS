const mongoose = require("mongoose");
const { getCurrentVietnamTime } = require("../utils/dateUtils");

// Item schema for order items with variant support
const orderItemSchema = new mongoose.Schema({
    dishId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Dish", 
        required: true 
    },
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    // Enhanced pricing structure for promotions
    originalPricePerQuantity: { 
        type: Number, 
        required: true, 
        min: 0 
    }, // Original dish price before any discounts
    pricePerQuantity: { 
        type: Number, 
        required: true, 
        min: 0 
    }, // Price per quantity after discounts
    quantity: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    originalPrice: { 
        type: Number, 
        required: true, 
        min: 0 
    }, // Total original price (originalPricePerQuantity * quantity)
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    }, // Final total price after all discounts
    
    // Promotion tracking for this item
    promotionsApplied: [{
        promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
        promotionName: { type: String, required: true },
        promotionType: { type: String, required: true },
        discountAmount: { type: Number, required: true, min: 0 },
        discountPercentage: { type: Number, min: 0, max: 100 },
        appliedAt: { type: Date, default: getCurrentVietnamTime }
    }],
    
    // Happy Hour specific tracking
    isHappyHourItem: { type: Boolean, default: false },
    happyHourDiscount: { type: Number, default: 0, min: 0 },
    
    category: { 
        type: String, 
        trim: true 
    },
    image: { 
        type: String, 
        trim: true 
    },
    variant: {
        size: { 
            type: String, 
            trim: true 
        },
        price: { 
            type: Number, 
            min: 0 
        },
        cost: { 
            type: Number, 
            min: 0, 
            default: 0 
        }
    },
    note: { 
        type: String, 
        trim: true 
    },
    toppings: [{
        toppingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topping",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }]
}, { _id: true });

const orderSchema = new mongoose.Schema({
    customerDetails: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        guests: { type: Number, min: 1 }
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['pending', 'progress', 'ready', 'completed', 'cancelled'],
        default: 'pending'
    },
    orderDate: {
        type: Date,
        default: getCurrentVietnamTime
    },
    bills: {
        subtotal: { type: Number, required: true, min: 0 }, // Before any discounts
        promotionDiscount: { type: Number, default: 0, min: 0 }, // Total promotion discount
        total: { type: Number, required: true, min: 0 }, // After promotions
        tax: { type: Number, default: 0, min: 0 },
        totalWithTax: { type: Number, required: true, min: 0 }
    },
    
    // NEW: Promotion tracking
    appliedPromotions: [{
        promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
        name: { type: String, required: true },
        type: { type: String, required: true },
        discountAmount: { type: Number, required: true, min: 0 },
        code: { type: String },
        appliedToItems: [{ type: String }] // Array of order item IDs that got the discount
    }],
    
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'Order must contain at least one item'
        }
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Banking', 'Card'],
        required: false,
        default: null
    },
    thirdPartyVendor: {
        type: String,
        enum: ['None', 'Shopee', 'Grab'],
        default: 'None'
    },
    paymentData: {
        razorpay_order_id: { type: String, trim: true },
        razorpay_payment_id: { type: String, trim: true }
    },
    createdBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, trim: true }
    }
}, { timestamps: true });

// Index for better query performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'customerDetails.phone': 1 });
orderSchema.index({ 'createdBy.userId': 1 });

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total unique dishes
orderSchema.virtual('uniqueDishes').get(function() {
    return this.items.length;
});

module.exports = mongoose.model("Order", orderSchema);