const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customerDetails: {
        name: { type: String},
        phone: { type: String},
    },
    orderStatus: {
        type: String,
        required: true
    },
    orderDate: {
        type: Date,
        default : Date.now()
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true }
    },
    items: [],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    paymentMethod: String,
    paymentData: {
        razorpay_order_id: String,
        razorpay_payment_id: String
    },
    createdBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String }
    }
}, { timestamps : true } );

module.exports = mongoose.model("Order", orderSchema);