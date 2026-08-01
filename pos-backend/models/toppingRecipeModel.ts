import mongoose from "mongoose";

const recipeLineSchema = new mongoose.Schema(
    {
        storageItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StorageItem",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        unit: {
            type: String,
            required: true,
            trim: true,
        },
        costPerUnit: {
            type: Number,
            default: 0,
            min: 0,
        },
        lineCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { _id: false }
);

const toppingRecipeSchema = new mongoose.Schema(
    {
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
            index: true,
        },
        toppingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topping",
            required: true,
        },
        ingredients: {
            type: [recipeLineSchema],
            default: [],
        },
        totalIngredientCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        otherCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        costPerServing: {
            type: Number,
            default: 0,
            min: 0,
        },
        servings: {
            type: Number,
            default: 1,
            min: 1,
        },
        prepTime: {
            type: Number,
            default: 0,
            min: 0,
        },
        instructions: {
            type: String,
            trim: true,
            default: "",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            userName: String,
        },
        lastModifiedBy: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            userName: String,
        },
        lastCostUpdate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

toppingRecipeSchema.index({ store: 1, toppingId: 1 }, { unique: true });
toppingRecipeSchema.index({ store: 1, isActive: 1 });
toppingRecipeSchema.index({ "ingredients.storageItemId": 1 });

export default mongoose.model("ToppingRecipe", toppingRecipeSchema);
