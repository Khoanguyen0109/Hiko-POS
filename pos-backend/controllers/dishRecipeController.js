const createHttpError = require("http-errors");
const DishRecipe = require("../models/dishRecipeModel");
const Dish = require("../models/dishModel");
const Ingredient = require("../models/ingredientModel");
const IngredientTransaction = require("../models/ingredientTransactionModel");
const { default: mongoose } = require("mongoose");

// Create or update recipe for a dish
const createOrUpdateRecipe = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const {
            dishId,
            ingredients = [],
            sizeVariantRecipes = [],
            servings = 1,
            prepTime = 0,
            instructions = "",
            notes = ""
        } = req.body;

        // Validate dishId
        if (!dishId || !mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Valid dish ID is required"));
        }

        // Check if dish exists
        const dish = await Dish.findById(dishId);
        if (!dish) {
            return next(createHttpError(404, "Dish not found"));
        }

        // Validate ingredients
        if (ingredients.length === 0 && sizeVariantRecipes.length === 0) {
            return next(createHttpError(400, "Recipe must have at least one ingredient"));
        }

        // Check if recipe already exists
        let recipe = await DishRecipe.findOne({ dishId });

        if (recipe) {
            // Update existing recipe
            recipe.ingredients = ingredients;
            recipe.sizeVariantRecipes = sizeVariantRecipes;
            recipe.servings = servings;
            recipe.prepTime = prepTime;
            recipe.instructions = instructions;
            recipe.notes = notes;
            recipe.lastModifiedBy = userId && userName ? { userId, userName } : undefined;
        } else {
            // Create new recipe
            recipe = new DishRecipe({
                dishId,
                ingredients,
                sizeVariantRecipes,
                servings,
                prepTime,
                instructions,
                notes,
                createdBy: userId && userName ? { userId, userName } : undefined
            });
        }

        // Calculate costs based on current ingredient prices
        await recipe.calculateCost();
        await recipe.save();

        // Update dish with recipe cost
        await updateDishCostsFromRecipe(dishId);

        // Populate for response
        await recipe.populate('dishId', 'name image category hasSizeVariants sizeVariants');
        await recipe.populate('ingredients.ingredientId', 'name code unit costs');
        await recipe.populate('sizeVariantRecipes.ingredients.ingredientId', 'name code unit costs');

        res.status(200).json({
            success: true,
            message: recipe.isNew ? "Recipe created successfully" : "Recipe updated successfully",
            data: recipe
        });
    } catch (error) {
        next(error);
    }
};

// Get recipe by dish ID
const getRecipeByDishId = async (req, res, next) => {
    try {
        const { dishId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Invalid dish ID"));
        }

        const recipe = await DishRecipe.findOne({ dishId })
            .populate('dishId', 'name image category hasSizeVariants sizeVariants')
            .populate('ingredients.ingredientId', 'name code unit costs inventory')
            .populate('sizeVariantRecipes.ingredients.ingredientId', 'name code unit costs inventory');

        if (!recipe) {
            return next(createHttpError(404, "Recipe not found for this dish"));
        }

        res.json({
            success: true,
            data: recipe
        });
    } catch (error) {
        next(error);
    }
};

// Get all recipes
const getAllRecipes = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
            isActive
        } = req.query;

        // Build query
        let query = {};
        // Default to active recipes only (exclude soft-deleted)
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        } else {
            query.isActive = true; // Default: only show active recipes
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get recipes
        let recipes = await DishRecipe.find(query)
            .populate('dishId', 'name image category hasSizeVariants sizeVariants')
            .populate('ingredients.ingredientId', 'name code unit')
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        // Filter by search if provided
        if (search) {
            recipes = recipes.filter(recipe => 
                recipe.dishId?.name?.toLowerCase().includes(search.toLowerCase())
            );
        }

        const totalCount = await DishRecipe.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            success: true,
            data: recipes,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum
            }
        });
    } catch (error) {
        next(error);
    }
};

// Delete recipe
const deleteRecipe = async (req, res, next) => {
    try {
        const { dishId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Invalid dish ID"));
        }

        const recipe = await DishRecipe.findOne({ dishId });
        if (!recipe) {
            return next(createHttpError(404, "Recipe not found"));
        }

        // Soft delete
        recipe.isActive = false;
        await recipe.save();

        // Reset dish costs to 0 when recipe is deleted
        const dish = await Dish.findById(dishId);
        if (dish) {
            if (dish.hasSizeVariants && dish.sizeVariants && dish.sizeVariants.length > 0) {
                // Reset all variant costs to 0
                dish.sizeVariants.forEach(variant => {
                    variant.cost = 0;
                });
            } else {
                // Reset base cost to 0
                dish.cost = 0;
            }
            await dish.save();
        }

        res.json({
            success: true,
            message: "Recipe deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Recalculate all recipe costs (useful when ingredient prices change)
const recalculateAllCosts = async (req, res, next) => {
    try {
        const recipes = await DishRecipe.find({ isActive: true });
        
        let updatedCount = 0;
        for (let recipe of recipes) {
            await recipe.calculateCost();
            await recipe.save();
            await updateDishCostsFromRecipe(recipe.dishId);
            updatedCount++;
        }

        res.json({
            success: true,
            message: `Successfully recalculated costs for ${updatedCount} recipes`,
            count: updatedCount
        });
    } catch (error) {
        next(error);
    }
};

// Calculate cost for specific dish and size
const calculateDishCost = async (req, res, next) => {
    try {
        const { dishId } = req.params;
        const { size } = req.query;

        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Invalid dish ID"));
        }

        const result = await DishRecipe.calculateDishCost(dishId, size);
        
        if (!result) {
            return next(createHttpError(404, "Recipe not found for this dish"));
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Export ingredients for an order (deduct from inventory)
const exportIngredientsForOrder = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user || {};
        const { orderId, items } = req.body;

        if (!orderId || !items || !Array.isArray(items)) {
            return next(createHttpError(400, "Order ID and items array are required"));
        }

        const transactions = [];
        const errors = [];

        // Process each order item
        for (let item of items) {
            const { dishId, quantity, variant } = item;
            
            // Get recipe for this dish
            const recipe = await DishRecipe.findOne({ dishId, isActive: true })
                .populate('ingredients.ingredientId')
                .populate('sizeVariantRecipes.ingredients.ingredientId');

            if (!recipe) {
                errors.push(`No recipe found for dish: ${dishId}`);
                continue;
            }

            // Get ingredients for this size
            const recipeData = recipe.getRecipeForSize(variant?.size);
            const ingredients = recipeData.ingredients;

            // Export each ingredient
            for (let recipeIng of ingredients) {
                const ingredient = recipeIng.ingredientId;
                const requiredQty = recipeIng.quantity * quantity; // recipe qty × order qty

                // Check if enough stock
                if (ingredient.inventory.currentStock < requiredQty) {
                    errors.push(
                        `Insufficient stock for ${ingredient.name}. ` +
                        `Required: ${requiredQty}${ingredient.unit}, ` +
                        `Available: ${ingredient.inventory.currentStock}${ingredient.unit}`
                    );
                    continue;
                }

                // Create export transaction
                const transactionNumber = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                const unitCost = ingredient.costs.averageCost || 0;
                const totalCost = requiredQty * unitCost;
                const stockBefore = ingredient.inventory.currentStock;
                const stockAfter = stockBefore - requiredQty;

                const transaction = new IngredientTransaction({
                    transactionNumber,
                    type: 'EXPORT',
                    ingredientId: ingredient._id,
                    quantity: requiredQty,
                    unit: ingredient.unit,
                    unitCost,
                    totalCost,
                    stockBefore,
                    stockAfter,
                    exportDetails: {
                        orderId,
                        dishId,
                        dishName: item.name || 'Unknown Dish',
                        reason: 'PRODUCTION'
                    },
                    createdBy: userId && userName ? { userId, userName } : undefined,
                    notes: `Auto-export for order ${orderId}`
                });

                await transaction.save();
                transactions.push(transaction);

                // Update ingredient stock
                ingredient.inventory.currentStock = stockAfter;
                await ingredient.save();
            }
        }

        if (errors.length > 0 && transactions.length === 0) {
            return next(createHttpError(400, errors.join('; ')));
        }

        res.json({
            success: true,
            message: `Successfully exported ingredients for ${transactions.length} ingredient(s)`,
            data: {
                transactions,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    } catch (error) {
        next(error);
    }
};

// Check if sufficient ingredients available for an order
const checkIngredientAvailability = async (req, res, next) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return next(createHttpError(400, "Items array is required"));
        }

        const availability = [];
        let allAvailable = true;

        for (let item of items) {
            const { dishId, quantity, variant } = item;
            
            const recipe = await DishRecipe.findOne({ dishId, isActive: true })
                .populate('ingredients.ingredientId')
                .populate('sizeVariantRecipes.ingredients.ingredientId');

            if (!recipe) {
                availability.push({
                    dishId,
                    dishName: item.name,
                    available: false,
                    reason: 'No recipe found'
                });
                allAvailable = false;
                continue;
            }

            const recipeData = recipe.getRecipeForSize(variant?.size);
            const ingredients = recipeData.ingredients;

            const missingIngredients = [];
            for (let recipeIng of ingredients) {
                const ingredient = recipeIng.ingredientId;
                const requiredQty = recipeIng.quantity * quantity;

                if (ingredient.inventory.currentStock < requiredQty) {
                    missingIngredients.push({
                        name: ingredient.name,
                        required: requiredQty,
                        available: ingredient.inventory.currentStock,
                        unit: ingredient.unit
                    });
                }
            }

            if (missingIngredients.length > 0) {
                allAvailable = false;
                availability.push({
                    dishId,
                    dishName: item.name,
                    available: false,
                    missingIngredients
                });
            } else {
                availability.push({
                    dishId,
                    dishName: item.name,
                    available: true
                });
            }
        }

        res.json({
            success: true,
            allAvailable,
            data: availability
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to update dish costs based on recipe
const updateDishCostsFromRecipe = async (dishId) => {
    try {
        const dish = await Dish.findById(dishId);
        const recipe = await DishRecipe.findOne({ dishId });

        if (!dish || !recipe) return;

        // Update dish cost based on recipe
        if (dish.hasSizeVariants && dish.sizeVariants && dish.sizeVariants.length > 0) {
            // Update each variant cost
            for (let variant of dish.sizeVariants) {
                const recipeVariant = recipe.sizeVariantRecipes.find(rv => rv.size === variant.size);
                if (recipeVariant) {
                    variant.cost = recipeVariant.totalIngredientCost;
                }
            }
        } else {
            // Update base cost
            dish.cost = recipe.totalIngredientCost || recipe.costPerServing || 0;
        }

        await dish.save();
    } catch (error) {
        console.error('Error updating dish costs:', error);
    }
};

module.exports = {
    createOrUpdateRecipe,
    getRecipeByDishId,
    getAllRecipes,
    deleteRecipe,
    recalculateAllCosts,
    calculateDishCost,
    exportIngredientsForOrder,
    checkIngredientAvailability
};

