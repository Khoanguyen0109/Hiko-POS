const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v);
            },
            message: "Phone number must be a 10-digit number!"
        }
    },

    point: {
        type: Number,
        min: 0,
        default: 0
    },

    class: {
        type: String,
        trim: true,
        default: "Standard"
    }
}, { timestamps: true });

customerSchema.index({ store: 1, phone: 1 });

module.exports = mongoose.model("Customer", customerSchema); 