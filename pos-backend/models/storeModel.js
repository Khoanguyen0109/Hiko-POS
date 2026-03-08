const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    settings: {
        currency: { type: String, default: "VND" },
        timezone: { type: String, default: "Asia/Ho_Chi_Minh" },
        openTime: { type: String },
        closeTime: { type: String }
    }
}, { timestamps: true });

storeSchema.index({ isActive: 1 });

module.exports = mongoose.model("Store", storeSchema);
