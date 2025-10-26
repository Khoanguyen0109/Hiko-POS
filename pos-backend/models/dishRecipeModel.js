const mongoose = require("mongoose");

// Sub-schema for recipe ingredients
const recipeIngredientSchema = new mongoose.Schema({
    ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    // Cost at time of recipe creation (for historical tracking)
    costPerUnit: {
        type: Number,
        default: 0
    },
    notes: String
}, { _id: false });

// Sub-schema for size-specific recipes
const sizeVariantRecipeSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true
    },
    ingredients: [recipeIngredientSchema],
    totalIngredientCost: {
        type: Number,
        default: 0
    }
}, { _id: false });

const dishRecipeSchema = new mongoose.Schema({
    dishId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dish',
        required: true,
        unique: true
    },
    
    // Default recipe (if dish has no size variants)
    ingredients: [recipeIngredientSchema],
    
    // Size-specific recipes (for dishes with variants like Small, Medium, Large)
    sizeVariantRecipes: [sizeVariantRecipeSchema],
    
    // Cost calculations
    totalIngredientCost: {
        type: Number,
        default: 0
    },
    costPerServing: {
        type: Number,
        default: 0
    },
    
    // Recipe details
    servings: {
        type: Number,
        default: 1,
        min: 1
    },
    prepTime: {
        type: Number, // in minutes
        default: 0
    },
    
    // Instructions
    instructions: {
        type: String,
        trim: true
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Metadata
    createdBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String
    },
    lastModifiedBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String
    },
    lastCostUpdate: {
        type: Date,
        default: Date.now
    },
    notes: String
}, { timestamps: true });

// Indexes
dishRecipeSchema.index({ dishId: 1 });
dishRecipeSchema.index({ 'ingredients.ingredientId': 1 });
dishRecipeSchema.index({ isActive: 1 });

// Method to calculate total cost based on current ingredient prices
dishRecipeSchema.methods.calculateCost = async function() {
    const Ingredient = mongoose.model('Ingredient');
    
    // Calculate cost for default recipe
    if (this.ingredients && this.ingredients.length > 0) {
        let totalCost = 0;
        
        for (let recipeIng of this.ingredients) {
            const ingredient = await Ingredient.findById(recipeIng.ingredientId);
            if (ingredient) {
                const cost = ingredient.costs.averageCost || ingredient.costs.standardCost || 0;
                recipeIng.costPerUnit = cost;
                totalCost += recipeIng.quantity * cost;
            }
        }
        
        this.totalIngredientCost = totalCost;
        this.costPerServing = this.servings > 0 ? totalCost / this.servings : totalCost;
    }
    
    // Calculate cost for each size variant
    if (this.sizeVariantRecipes && this.sizeVariantRecipes.length > 0) {
        for (let variant of this.sizeVariantRecipes) {
            let variantCost = 0;
            
            for (let recipeIng of variant.ingredients) {
                const ingredient = await Ingredient.findById(recipeIng.ingredientId);
                if (ingredient) {
                    const cost = ingredient.costs.averageCost || ingredient.costs.standardCost || 0;
                    recipeIng.costPerUnit = cost;
                    variantCost += recipeIng.quantity * cost;
                }
            }
            
            variant.totalIngredientCost = variantCost;
        }
    }
    
    this.lastCostUpdate = new Date();
    return this;
};

// Method to get recipe for a specific size
dishRecipeSchema.methods.getRecipeForSize = function(size) {
    if (!size || this.sizeVariantRecipes.length === 0) {
        return {
            ingredients: this.ingredients,
            totalCost: this.totalIngredientCost
        };
    }
    
    const variant = this.sizeVariantRecipes.find(v => v.size === size);
    if (variant) {
        return {
            ingredients: variant.ingredients,
            totalCost: variant.totalIngredientCost
        };
    }
    
    return {
        ingredients: this.ingredients,
        totalCost: this.totalIngredientCost
    };
};

// Static method to calculate cost for a specific dish and size
dishRecipeSchema.statics.calculateDishCost = async function(dishId, size = null) {
    const recipe = await this.findOne({ dishId, isActive: true })
        .populate('ingredients.ingredientId', 'name code unit costs')
        .populate('sizeVariantRecipes.ingredients.ingredientId', 'name code unit costs');
    
    if (!recipe) {
        return null;
    }
    
    await recipe.calculateCost();
    await recipe.save();
    
    return recipe.getRecipeForSize(size);
};

// Virtual for ingredient count
dishRecipeSchema.virtual('ingredientCount').get(function() {
    if (this.sizeVariantRecipes && this.sizeVariantRecipes.length > 0) {
        return this.sizeVariantRecipes[0].ingredients.length;
    }
    return this.ingredients ? this.ingredients.length : 0;
});

dishRecipeSchema.set('toJSON', { virtuals: true });
dishRecipeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("DishRecipe", dishRecipeSchema);

