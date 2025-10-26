const ToppingRecipe = require("../models/toppingRecipeModel");
const Topping = require("../models/toppingModel");
const Ingredient = require("../models/ingredientModel");

/**
 * @desc    Create or update a topping recipe
 * @route   POST /api/topping-recipe
 * @access  Private
 */
exports.createOrUpdateToppingRecipe = async (req, res, next) => {
  try {
    const { toppingId, ingredients, yield: yieldData, preparationTime, preparationNotes, isActive } = req.body;

    // Validate topping exists
    const topping = await Topping.findById(toppingId);
    if (!topping) {
      return res.status(404).json({
        success: false,
        message: "Topping not found"
      });
    }

    // Validate all ingredients exist
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        const ingredient = await Ingredient.findById(ing.ingredientId);
        if (!ingredient) {
          return res.status(404).json({
            success: false,
            message: `Ingredient with ID ${ing.ingredientId} not found`
          });
        }
      }
    }

    // Check if recipe already exists
    let recipe = await ToppingRecipe.findOne({ toppingId });

    if (recipe) {
      // Update existing recipe
      recipe.ingredients = ingredients || recipe.ingredients;
      recipe.yield = yieldData || recipe.yield;
      recipe.preparationTime = preparationTime !== undefined ? preparationTime : recipe.preparationTime;
      recipe.preparationNotes = preparationNotes !== undefined ? preparationNotes : recipe.preparationNotes;
      recipe.isActive = isActive !== undefined ? isActive : recipe.isActive;
    } else {
      // Create new recipe
      recipe = new ToppingRecipe({
        toppingId,
        ingredients: ingredients || [],
        yield: yieldData || { amount: 1, unit: "serving" },
        preparationTime: preparationTime || 0,
        preparationNotes: preparationNotes || "",
        isActive: isActive !== undefined ? isActive : true
      });
    }

    // Calculate cost
    await recipe.populate("ingredients.ingredientId");
    await recipe.calculateCost();
    await recipe.save();

    // Update topping's cost
    topping.cost = recipe.costPerServing;
    await topping.save();

    // Populate for response
    await recipe.populate("toppingId");

    res.status(200).json({
      success: true,
      message: recipe.isNew ? "Topping recipe created successfully" : "Topping recipe updated successfully",
      data: recipe
    });
  } catch (error) {
    console.error("Error creating/updating topping recipe:", error);
    next(error);
  }
};

/**
 * @desc    Get all topping recipes
 * @route   GET /api/topping-recipe
 * @access  Private
 */
exports.getAllToppingRecipes = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    let recipes = await ToppingRecipe.find(filter)
      .populate("toppingId")
      .populate("ingredients.ingredientId")
      .sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      recipes = recipes.filter(recipe => {
        const toppingName = recipe.toppingId?.name?.toLowerCase() || "";
        return toppingName.includes(searchLower);
      });
    }

    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });
  } catch (error) {
    console.error("Error fetching topping recipes:", error);
    next(error);
  }
};

/**
 * @desc    Get recipe for a specific topping
 * @route   GET /api/topping-recipe/topping/:toppingId
 * @access  Private
 */
exports.getToppingRecipeByToppingId = async (req, res, next) => {
  try {
    const { toppingId } = req.params;

    const recipe = await ToppingRecipe.findOne({ toppingId })
      .populate("toppingId")
      .populate("ingredients.ingredientId");

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found for this topping"
      });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error("Error fetching topping recipe:", error);
    next(error);
  }
};

/**
 * @desc    Delete a topping recipe
 * @route   DELETE /api/topping-recipe/topping/:toppingId
 * @access  Private
 */
exports.deleteToppingRecipe = async (req, res, next) => {
  try {
    const { toppingId } = req.params;

    const recipe = await ToppingRecipe.findOneAndDelete({ toppingId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Topping recipe deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting topping recipe:", error);
    next(error);
  }
};

/**
 * @desc    Calculate cost for a specific topping recipe
 * @route   GET /api/topping-recipe/topping/:toppingId/cost
 * @access  Private
 */
exports.calculateToppingRecipeCost = async (req, res, next) => {
  try {
    const { toppingId } = req.params;

    const recipe = await ToppingRecipe.findOne({ toppingId, isActive: true })
      .populate("ingredients.ingredientId");

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Active recipe not found for this topping"
      });
    }

    const totalCost = await recipe.calculateCost();

    res.status(200).json({
      success: true,
      data: {
        toppingId,
        totalIngredientCost: recipe.totalIngredientCost,
        costPerServing: recipe.costPerServing,
        yield: recipe.yield,
        breakdown: recipe.ingredients.map(ing => ({
          ingredient: ing.ingredientId?.name,
          quantity: ing.quantity,
          unit: ing.unit,
          unitCost: ing.ingredientId?.costs?.averageCost || 0,
          totalCost: ing.quantity * (ing.ingredientId?.costs?.averageCost || 0)
        }))
      }
    });
  } catch (error) {
    console.error("Error calculating topping recipe cost:", error);
    next(error);
  }
};

/**
 * @desc    Recalculate all topping costs
 * @route   POST /api/topping-recipe/recalculate-all
 * @access  Private
 */
exports.recalculateAllToppingCosts = async (req, res, next) => {
  try {
    const results = await ToppingRecipe.recalculateAllToppingCosts();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Recalculated costs for ${successCount} toppings. ${failureCount} failed.`,
      data: results
    });
  } catch (error) {
    console.error("Error recalculating all topping costs:", error);
    next(error);
  }
};

/**
 * @desc    Clone a topping recipe
 * @route   POST /api/topping-recipe/topping/:toppingId/clone
 * @access  Private
 */
exports.cloneToppingRecipe = async (req, res, next) => {
  try {
    const { toppingId } = req.params;
    const { newToppingId } = req.body;

    if (!newToppingId) {
      return res.status(400).json({
        success: false,
        message: "New topping ID is required"
      });
    }

    // Validate new topping exists
    const newTopping = await Topping.findById(newToppingId);
    if (!newTopping) {
      return res.status(404).json({
        success: false,
        message: "New topping not found"
      });
    }

    // Get source recipe
    const sourceRecipe = await ToppingRecipe.findOne({ toppingId })
      .populate("ingredients.ingredientId");

    if (!sourceRecipe) {
      return res.status(404).json({
        success: false,
        message: "Source recipe not found"
      });
    }

    // Check if recipe already exists for new topping
    const existingRecipe = await ToppingRecipe.findOne({ toppingId: newToppingId });
    if (existingRecipe) {
      return res.status(400).json({
        success: false,
        message: "Recipe already exists for the target topping"
      });
    }

    // Create new recipe
    const newRecipe = new ToppingRecipe({
      toppingId: newToppingId,
      ingredients: sourceRecipe.ingredients.map(ing => ({
        ingredientId: ing.ingredientId._id,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes
      })),
      yield: { ...sourceRecipe.yield },
      preparationTime: sourceRecipe.preparationTime,
      preparationNotes: sourceRecipe.preparationNotes,
      isActive: true
    });

    await newRecipe.populate("ingredients.ingredientId");
    await newRecipe.calculateCost();
    await newRecipe.save();

    // Update topping cost
    newTopping.cost = newRecipe.costPerServing;
    await newTopping.save();

    await newRecipe.populate("toppingId");

    res.status(201).json({
      success: true,
      message: "Topping recipe cloned successfully",
      data: newRecipe
    });
  } catch (error) {
    console.error("Error cloning topping recipe:", error);
    next(error);
  }
};

