// @ts-nocheck
import createHttpError from "http-errors";
import mongoose from "mongoose";
import Topping from "../models/toppingModel.js";
import ToppingRecipe from "../models/toppingRecipeModel.js";
import StorageItem from "../models/storageItemModel.js";
import {
    calculateRecipeCost,
    recalculateAllToppingRecipeCosts,
    updateToppingCostsFromRecipe,
} from "../services/recipeService.js";

interface RecipeLineBody {
    storageItemId: string;
    quantity: number;
    unit: string;
    notes?: string;
}

interface ToppingRecipeBody {
    toppingId: string;
    ingredients?: RecipeLineBody[];
    servings?: number;
    prepTime?: number;
    instructions?: string;
    notes?: string;
    otherCost?: number;
}

const recipePopulate = [
    { path: "toppingId", select: "name price cost category isAvailable" },
    {
        path: "ingredients.storageItemId",
        select: "name code unit averageCost currentStock contentQuantity contentUnit",
    },
];

async function validateStorageItemsBelongToStore(storeId, lines) {
    const ids = [...new Set(lines.map((line) => line.storageItemId))].filter(Boolean);

    if (ids.length === 0) {
        return;
    }

    for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw createHttpError(400, `Invalid storage item ID: ${id}`);
        }
    }

    const count = await StorageItem.countDocuments({
        _id: { $in: ids },
        store: storeId,
        isActive: true,
    });

    if (count !== ids.length) {
        throw createHttpError(400, "One or more storage items are invalid for this store");
    }
}

function validateRecipeLines(lines) {
    for (const line of lines) {
        if (!line.storageItemId) {
            throw createHttpError(400, "Each recipe line requires a storage item");
        }
        if (typeof line.quantity !== "number" || line.quantity <= 0) {
            throw createHttpError(400, "Each recipe line requires a positive quantity");
        }
        if (!line.unit || line.unit.trim().length === 0) {
            throw createHttpError(400, "Each recipe line requires a unit");
        }
    }
}

export const createOrUpdateToppingRecipe = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user ?? {};
        const body = req.body as ToppingRecipeBody;
        const {
            toppingId,
            ingredients = [],
            servings = 1,
            prepTime = 0,
            instructions = "",
            notes = "",
            otherCost = 0,
        } = body;

        if (!toppingId || !mongoose.Types.ObjectId.isValid(toppingId)) {
            return next(createHttpError(400, "Valid topping ID is required"));
        }

        const topping = await Topping.findOne({
            _id: toppingId,
            store: req.store._id,
        });

        if (!topping) {
            return next(createHttpError(404, "Topping not found"));
        }

        if (ingredients.length === 0) {
            return next(createHttpError(400, "Recipe must have at least one ingredient line"));
        }

        validateRecipeLines(ingredients);
        await validateStorageItemsBelongToStore(req.store._id, ingredients);

        let recipe = await ToppingRecipe.findOne({
            store: req.store._id,
            toppingId,
        });

        const userMeta = userId && userName ? { userId, userName } : undefined;

        if (recipe) {
            recipe.ingredients = ingredients;
            recipe.servings = servings;
            recipe.prepTime = prepTime;
            recipe.instructions = instructions;
            recipe.notes = notes;
            recipe.otherCost = Math.max(0, Number(otherCost) || 0);
            recipe.isActive = true;
            if (userMeta) {
                recipe.lastModifiedBy = userMeta;
            }
        } else {
            recipe = new ToppingRecipe({
                store: req.store._id,
                toppingId,
                ingredients,
                servings,
                prepTime,
                instructions,
                notes,
                otherCost: Math.max(0, Number(otherCost) || 0),
                createdBy: userMeta,
            });
        }

        await calculateRecipeCost(recipe, req.store._id);
        await recipe.save();
        await updateToppingCostsFromRecipe(toppingId);

        await recipe.populate(recipePopulate);

        res.status(200).json({
            success: true,
            message: recipe.isNew ? "Topping recipe created successfully" : "Topping recipe updated successfully",
            data: recipe,
        });
    } catch (error) {
        next(error);
    }
};

export const getToppingRecipeByToppingId = async (req, res, next) => {
    try {
        const { toppingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(toppingId)) {
            return next(createHttpError(400, "Invalid topping ID"));
        }

        const recipe = await ToppingRecipe.findOne({
            store: req.store._id,
            toppingId,
            isActive: true,
        }).populate(recipePopulate);

        if (!recipe) {
            return next(createHttpError(404, "Recipe not found for this topping"));
        }

        res.json({ success: true, data: recipe });
    } catch (error) {
        next(error);
    }
};

export const getAllToppingRecipes = async (req, res, next) => {
    try {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = parseInt(String(req.query.limit ?? "50"), 10);
        const search = String(req.query.search ?? "").trim();
        const skip = (page - 1) * limit;

        const query = {
            store: req.store._id,
            isActive: true,
        };

        let recipes = await ToppingRecipe.find(query)
            .populate(recipePopulate)
            .skip(skip)
            .limit(limit)
            .sort({ updatedAt: -1 });

        if (search) {
            const lowerSearch = search.toLowerCase();
            recipes = recipes.filter((recipe) =>
                recipe.toppingId &&
                typeof recipe.toppingId === "object" &&
                "name" in recipe.toppingId &&
                typeof recipe.toppingId.name === "string" &&
                recipe.toppingId.name.toLowerCase().includes(lowerSearch)
            );
        }

        const totalCount = await ToppingRecipe.countDocuments(query);

        res.json({
            success: true,
            data: recipes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                limit,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteToppingRecipe = async (req, res, next) => {
    try {
        const { toppingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(toppingId)) {
            return next(createHttpError(400, "Invalid topping ID"));
        }

        const recipe = await ToppingRecipe.findOne({
            store: req.store._id,
            toppingId,
            isActive: true,
        });

        if (!recipe) {
            return next(createHttpError(404, "Recipe not found"));
        }

        recipe.isActive = false;
        await recipe.save();

        const topping = await Topping.findOne({
            _id: toppingId,
            store: req.store._id,
        });

        if (topping) {
            topping.cost = 0;
            await topping.save();
        }

        res.json({
            success: true,
            message: "Topping recipe deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const recalculateAllToppingCosts = async (req, res, next) => {
    try {
        const updatedCount = await recalculateAllToppingRecipeCosts(req.store._id);

        res.json({
            success: true,
            message: `Recalculated costs for ${updatedCount} topping recipe(s)`,
            data: { updatedCount },
        });
    } catch (error) {
        next(error);
    }
};

export const calculateToppingCost = async (req, res, next) => {
    try {
        const { toppingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(toppingId)) {
            return next(createHttpError(400, "Invalid topping ID"));
        }

        const recipe = await ToppingRecipe.findOne({
            store: req.store._id,
            toppingId,
            isActive: true,
        }).populate(recipePopulate);

        if (!recipe) {
            return next(createHttpError(404, "Recipe not found for this topping"));
        }

        await calculateRecipeCost(recipe, req.store._id);
        await recipe.save();
        await updateToppingCostsFromRecipe(toppingId);

        res.json({
            success: true,
            data: {
                toppingId,
                totalCost: recipe.totalIngredientCost,
                otherCost: recipe.otherCost || 0,
                totalRecipeCost: (recipe.totalIngredientCost || 0) + (recipe.otherCost || 0),
                costPerServing: recipe.costPerServing,
                ingredients: recipe.ingredients,
                lastCostUpdate: recipe.lastCostUpdate,
            },
        });
    } catch (error) {
        next(error);
    }
};
