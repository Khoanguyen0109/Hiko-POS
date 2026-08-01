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

const sizeVariantRecipeSchema = new mongoose.Schema(
    {
        size: {
            type: String,
            required: true,
            trim: true,
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
    },
    { _id: false }
);

const dishRecipeSchema = new mongoose.Schema(
    {
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
            index: true,
        },
        dishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dish",
            required: true,
        },
        ingredients: {
            type: [recipeLineSchema],
            default: [],
        },
        sizeVariantRecipes: {
            type: [sizeVariantRecipeSchema],
            default: [],
        },
        totalIngredientCost: {
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

dishRecipeSchema.index({ store: 1, dishId: 1 }, { unique: true });
dishRecipeSchema.index({ store: 1, isActive: 1 });
dishRecipeSchema.index({ "ingredients.storageItemId": 1 });

export default mongoose.model("DishRecipe", dishRecipeSchema);
