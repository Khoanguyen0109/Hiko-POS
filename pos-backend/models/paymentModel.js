const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    paymentId: String,
    orderId: String,
    amount: Number,
    currency: String,
    status: String,
    method: String,
    email: String,
    contact: String,
    createdAt: Date
})

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;