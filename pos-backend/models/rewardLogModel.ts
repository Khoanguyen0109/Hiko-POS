import mongoose from "mongoose";

const rewardLogSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["dish_earned", "reward_unlocked", "reward_redeemed", "reward_restored", "reward_revoked", "dish_deducted"]
    },
    dishCount: {
        type: Number,
        default: 0
    },
    rewardProgram: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RewardProgram",
        default: null
    },
    cumulativeDishCount: {
        type: Number,
        required: true,
        min: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

rewardLogSchema.index({ customer: 1, type: 1 });
rewardLogSchema.index({ customer: 1, rewardProgram: 1, type: 1 });
rewardLogSchema.index({ order: 1 });

export default mongoose.model("RewardLog", rewardLogSchema);
