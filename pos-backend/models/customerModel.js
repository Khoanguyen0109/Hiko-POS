const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
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

module.exports = mongoose.model("Customer", customerSchema); 