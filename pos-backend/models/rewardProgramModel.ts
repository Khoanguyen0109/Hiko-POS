import mongoose from "mongoose";

const rewardProgramSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },
    type: {
        type: String,
        required: true,
        enum: ["percentage_discount", "free_dish"]
    },
    dishThreshold: {
        type: Number,
        required: true,
        min: 1
    },
    discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    maxFreeDishValue: {
        type: Number,
        min: 0,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

rewardProgramSchema.index({ isActive: 1, priority: 1 });

export default mongoose.model("RewardProgram", rewardProgramSchema);
