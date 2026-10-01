import mongoose from "mongoose";

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
    mapUrl: {
        type: String,
        trim: true,
        default: ""
    },
    bankName: {
        type: String,
        trim: true,
        default: ""
    },
    bankAccountNumber: {
        type: String,
        trim: true,
        default: ""
    },
    bankAccountName: {
        type: String,
        trim: true,
        default: ""
    },
    bankQrImage: {
        type: String,
        trim: true,
        default: ""
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

export default mongoose.model("Store", storeSchema);