const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema({
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

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

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

    // Arbitrary object for ingredients breakdown, e.g., { tomato: 2, cheese: "50g" }
    ingredients: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model("Dish", dishSchema); 