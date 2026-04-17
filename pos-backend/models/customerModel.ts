import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: ""
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: {
            validator: function (v: string) {
                return /^\d{10}$/.test(v);
            },
            message: "Phone number must be a 10-digit number!"
        }
    },
    nickname: {
        type: String,
        trim: true,
        default: ""
    },
    totalDishCount: {
        type: Number,
        min: 0,
        default: 0
    }
}, { timestamps: true });

customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ name: 1 });
customerSchema.index({ nickname: 1 });

export default mongoose.model("Customer", customerSchema);
