const mongoose = require("mongoose");

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
    pricePerQuantity: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    quantity: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },
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
    }
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
        default: Date.now
    },
    bills: {
        total: { type: Number, required: true, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        totalWithTax: { type: Number, required: true, min: 0 }
    },
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
        enum: ['Cash', 'Online', 'Card'],
        required: true
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