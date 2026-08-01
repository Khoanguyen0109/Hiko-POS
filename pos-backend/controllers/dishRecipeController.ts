// @ts-nocheck
import createHttpError from "http-errors";
import mongoose from "mongoose";
import Dish from "../models/dishModel.js";
import DishRecipe from "../models/dishRecipeModel.js";
import StorageItem from "../models/storageItemModel.js";
import {
    calculateRecipeCost,
    getRecipeForSize,
    recalculateAllRecipeCosts,
    updateDishCostsFromRecipe,
} from "../services/recipeService.js";

interface RecipeLineBody {
    storageItemId: string;
    quantity: number;
    unit: string;
    notes?: string;
}

interface SizeVariantRecipeBody {
    size: string;
    ingredients: RecipeLineBody[];
}

interface RecipeBody {
    dishId: string;
    ingredients?: RecipeLineBody[];
    sizeVariantRecipes?: SizeVariantRecipeBody[];
    servings?: number;
    prepTime?: number;
    instructions?: string;
    notes?: string;
}

const recipePopulate = [
    { path: "dishId", select: "name image category hasSizeVariants sizeVariants price cost" },
    { path: "ingredients.storageItemId", select: "name code unit averageCost currentStock" },
    { path: "sizeVariantRecipes.ingredients.storageItemId", select: "name code unit averageCost currentStock" },
];

async function validateStorageItemsBelongToStore(
    storeId: Types.ObjectId,
    lines: RecipeLineBody[]
): Promise<void> {
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

function collectLines(body: RecipeBody): RecipeLineBody[] {
    const defaultLines = body.ingredients ?? [];
    const variantLines = (body.sizeVariantRecipes ?? []).flatMap(
        (variant) => variant.ingredients ?? []
    );
    return [...defaultLines, ...variantLines];
}

function validateRecipeLines(lines: RecipeLineBody[]): void {
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

export const createOrUpdateRecipe = async (req, res, next) => {
    try {
        const { _id: userId, name: userName } = req.user ?? {};
        const body = req.body as RecipeBody;
        const {
            dishId,
            ingredients = [],
            sizeVariantRecipes = [],
            servings = 1,
            prepTime = 0,
            instructions = "",
            notes = "",
        } = body;

        if (!dishId || !mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Valid dish ID is required"));
        }

        const dish = await Dish.findById(dishId);
        if (!dish) {
            return next(createHttpError(404, "Dish not found"));
        }

        if (ingredients.length === 0 && sizeVariantRecipes.length === 0) {
            return next(createHttpError(400, "Recipe must have at least one ingredient line"));
        }

        const allLines = collectLines(body);
        validateRecipeLines(allLines);
        await validateStorageItemsBelongToStore(req.store._id, allLines);

        let recipe = await DishRecipe.findOne({
            store: req.store._id,
            dishId,
        });

        const userMeta =
            userId && userName ? { userId, userName } : undefined;

        if (recipe) {
            recipe.ingredients = ingredients;
            recipe.sizeVariantRecipes = sizeVariantRecipes;
            recipe.servings = servings;
            recipe.prepTime = prepTime;
            recipe.instructions = instructions;
            recipe.notes = notes;
            recipe.isActive = true;
            if (userMeta) {
                recipe.lastModifiedBy = userMeta;
            }
        } else {
            recipe = new DishRecipe({
                store: req.store._id,
                dishId,
                ingredients,
                sizeVariantRecipes,
                servings,
                prepTime,
                instructions,
                notes,
                createdBy: userMeta,
            });
        }

        await calculateRecipeCost(recipe, req.store._id);
        await recipe.save();
        await updateDishCostsFromRecipe(dishId);

        await recipe.populate(recipePopulate);

        res.status(200).json({
            success: true,
            message: recipe.isNew ? "Recipe created successfully" : "Recipe updated successfully",
            data: recipe,
        });
    } catch (error) {
        next(error);
    }
};

export const getRecipeByDishId = async (req, res, next) => {
    try {
        const { dishId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Invalid dish ID"));
        }

        const recipe = await DishRecipe.findOne({
            store: req.store._id,
            dishId,
            isActive: true,
        }).populate(recipePopulate);

        if (!recipe) {
            return next(createHttpError(404, "Recipe not found for this dish"));
        }

        res.json({ success: true, data: recipe });
    } catch (error) {
        next(error);
    }
};

export const getAllRecipes = async (req, res, next) => {
    try {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = parseInt(String(req.query.limit ?? "50"), 10);
        const search = String(req.query.search ?? "").trim();
        const skip = (page - 1) * limit;

        const query = {
            store: req.store._id,
            isActive: true,
        };

        let recipes = await DishRecipe.find(query)
            .populate(recipePopulate)
            .skip(skip)
            .limit(limit)
            .sort({ updatedAt: -1 });

        if (search) {
            const lowerSearch = search.toLowerCase();
            recipes = recipes.filter((recipe) =>
                recipe.dishId &&
                typeof recipe.dishId === "object" &&
                "name" in recipe.dishId &&
                typeof recipe.dishId.name === "string" &&
                recipe.dishId.name.toLowerCase().includes(lowerSearch)
            );
        }

        const totalCount = await DishRecipe.countDocuments(query);

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

export const deleteRecipe = async (req, res, next) => {
    try {
        const { dishId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Invalid dish ID"));
        }

        const recipe = await DishRecipe.findOne({
            store: req.store._id,
            dishId,
            isActive: true,
        });

        if (!recipe) {
            return next(createHttpError(404, "Recipe not found"));
        }

        recipe.isActive = false;
        await recipe.save();

        const dish = await Dish.findById(dishId);
        if (dish) {
            if (dish.hasSizeVariants && dish.sizeVariants.length > 0) {
                dish.sizeVariants.forEach((variant) => {
                    variant.cost = 0;
                });
            } else {
                dish.cost = 0;
            }
            await dish.save();
        }

        res.json({
            success: true,
            message: "Recipe deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const recalculateAllCosts = async (req, res, next) => {
    try {
        const updatedCount = await recalculateAllRecipeCosts(req.store._id);

        res.json({
            success: true,
            message: `Recalculated costs for ${updatedCount} recipe(s)`,
            data: { updatedCount },
        });
    } catch (error) {
        next(error);
    }
};

export const calculateDishCost = async (req, res, next) => {
    try {
        const { dishId } = req.params;
        const size = typeof req.query.size === "string" ? req.query.size : null;

        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Invalid dish ID"));
        }

        const recipe = await DishRecipe.findOne({
            store: req.store._id,
            dishId,
            isActive: true,
        }).populate(recipePopulate);

        if (!recipe) {
            return next(createHttpError(404, "Recipe not found for this dish"));
        }

        await calculateRecipeCost(recipe, req.store._id);
        await recipe.save();
        await updateDishCostsFromRecipe(dishId);

        const costData = getRecipeForSize(recipe, size);

        res.json({
            success: true,
            data: {
                dishId,
                size,
                totalCost: costData.totalCost,
                ingredients: costData.ingredients,
                lastCostUpdate: recipe.lastCostUpdate,
            },
        });
    } catch (error) {
        next(error);
    }
};
