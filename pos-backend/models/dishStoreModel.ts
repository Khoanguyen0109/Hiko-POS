import mongoose from "mongoose";

const SIZE_OPTIONS = ["Small", "Medium", "Large", "Extra Large", "Regular"] as const;

const dishStoreSizeVariantSchema = new mongoose.Schema(
    {
        size: {
            type: String,
            required: true,
            trim: true,
            enum: SIZE_OPTIONS,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        cost: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    { _id: false }
);

const dishStoreSchema = new mongoose.Schema(
    {
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
            index: true,
        },
        dish: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dish",
            required: true,
        },
        isAvailable: {
            type: Boolean,
            required: true,
            default: true,
        },
        price: {
            type: Number,
            min: 0,
            default: null,
        },
        cost: {
            type: Number,
            min: 0,
            default: null,
        },
        sizeVariants: {
            type: [dishStoreSizeVariantSchema],
            default: [],
        },
    },
    { timestamps: true }
);

dishStoreSchema.index({ store: 1, dish: 1 }, { unique: true });
dishStoreSchema.index({ store: 1, isAvailable: 1 });

export default mongoose.model("DishStore", dishStoreSchema);
export { SIZE_OPTIONS };
