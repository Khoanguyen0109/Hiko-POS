const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    tableNo: { type: Number, required: true },
    status: {
        type: String,
        default: "Available"
    },
    seats: { 
        type: Number,
        required: true
    },
    currentOrder: {type: mongoose.Schema.Types.ObjectId, ref: "Order"}
});

tableSchema.index({ store: 1, tableNo: 1 });

module.exports = mongoose.model("Table", tableSchema);