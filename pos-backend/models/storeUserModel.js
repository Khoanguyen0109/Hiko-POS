const mongoose = require("mongoose");

const storeUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    role: {
        type: String,
        enum: ["Owner", "Manager", "Staff"],
        default: "Staff"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

storeUserSchema.index({ user: 1, store: 1 }, { unique: true });
storeUserSchema.index({ store: 1, isActive: 1 });
storeUserSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("StoreUser", storeUserSchema);
