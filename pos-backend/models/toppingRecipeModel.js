const mongoose = require("mongoose");

// Schema for individual ingredient in a topping recipe
const recipeIngredientSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
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
  notes: {
    type: String,
    default: ""
  }
}, { _id: false });

// Main Topping Recipe Schema
const toppingRecipeSchema = new mongoose.Schema(
  {
    toppingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topping",
      required: true,
      unique: true
    },
    ingredients: [recipeIngredientSchema],
    totalIngredientCost: {
      type: Number,
      default: 0,
      min: 0
    },
    costPerServing: {
      type: Number,
      default: 0,
      min: 0
    },
    yield: {
      amount: {
        type: Number,
        default: 1
      },
      unit: {
        type: String,
        default: "serving"
      }
    },
    preparationTime: {
      type: Number, // in minutes
      default: 0
    },
    preparationNotes: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for faster queries
toppingRecipeSchema.index({ toppingId: 1, isActive: 1 });

// Virtual to get topping details
toppingRecipeSchema.virtual("toppingDetails", {
  ref: "Topping",
  localField: "toppingId",
  foreignField: "_id",
  justOne: true
});

// Method to calculate total ingredient cost
toppingRecipeSchema.methods.calculateCost = async function() {
  let totalCost = 0;

  for (const recipeIng of this.ingredients) {
    await recipeIng.ingredientId.populate("ingredientId");
    const ingredient = recipeIng.ingredientId;
    
    if (ingredient && ingredient.costs && ingredient.costs.averageCost) {
      const ingredientCost = recipeIng.quantity * ingredient.costs.averageCost;
      totalCost += ingredientCost;
    }
  }

  this.totalIngredientCost = totalCost;
  
  // Calculate cost per serving
  const yieldAmount = this.yield.amount || 1;
  this.costPerServing = totalCost / yieldAmount;

  return totalCost;
};

// Static method to recalculate cost for a topping
toppingRecipeSchema.statics.recalculateToppingCost = async function(toppingId) {
  const recipe = await this.findOne({ toppingId, isActive: true })
    .populate("ingredients.ingredientId");

  if (!recipe) {
    return null;
  }

  await recipe.calculateCost();
  await recipe.save();

  // Update the topping's cost field
  const Topping = mongoose.model("Topping");
  const topping = await Topping.findById(toppingId);
  
  if (topping) {
    topping.cost = recipe.costPerServing;
    await topping.save();
  }

  return recipe;
};

// Static method to recalculate all topping costs
toppingRecipeSchema.statics.recalculateAllToppingCosts = async function() {
  const recipes = await this.find({ isActive: true })
    .populate("ingredients.ingredientId");

  const Topping = mongoose.model("Topping");
  const results = [];

  for (const recipe of recipes) {
    try {
      await recipe.calculateCost();
      await recipe.save();

      // Update topping cost
      const topping = await Topping.findById(recipe.toppingId);
      if (topping) {
        topping.cost = recipe.costPerServing;
        await topping.save();
        results.push({
          toppingId: recipe.toppingId,
          toppingName: topping.name,
          cost: recipe.costPerServing,
          success: true
        });
      }
    } catch (error) {
      results.push({
        toppingId: recipe.toppingId,
        error: error.message,
        success: false
      });
    }
  }

  return results;
};

const ToppingRecipe = mongoose.model("ToppingRecipe", toppingRecipeSchema);
module.exports = ToppingRecipe;

