import type { Types } from "mongoose";

import Dish from "../models/dishModel.js";
import DishRecipe from "../models/dishRecipeModel.js";
import StorageItem from "../models/storageItemModel.js";
import { calculateLineCost } from "../utils/unitConversion.js";

interface RecipeLineInput {
    storageItemId: Types.ObjectId | string;
    quantity: number;
    unit: string;
    notes?: string | null;
    costPerUnit?: number;
    lineCost?: number;
}

interface SizeVariantRecipeInput {
    size: string;
    ingredients: RecipeLineInput[];
    totalIngredientCost?: number;
}

type RecipeDocument = {
    ingredients: RecipeLineInput[];
    sizeVariantRecipes: SizeVariantRecipeInput[];
    servings: number;
    totalIngredientCost: number;
    costPerServing: number;
    lastCostUpdate: Date;
    save(): Promise<unknown>;
};

async function loadStorageItemCosts(
    storeId: Types.ObjectId | string,
    lines: RecipeLineInput[]
): Promise<Map<string, { unit: string; averageCost: number }>> {
    const ids = [...new Set(lines.map((line) => String(line.storageItemId)))];
    const items = await StorageItem.find({
        _id: { $in: ids },
        store: storeId,
        isActive: true,
    }).select("_id unit averageCost");

    const costMap = new Map<string, { unit: string; averageCost: number }>();
    for (const item of items) {
        costMap.set(String(item._id), {
            unit: item.unit,
            averageCost: item.averageCost ?? 0,
        });
    }

    return costMap;
}

function calculateLinesCost(
    lines: RecipeLineInput[],
    costMap: Map<string, { unit: string; averageCost: number }>
): number {
    let total = 0;

    for (const line of lines) {
        const itemCost = costMap.get(String(line.storageItemId));
        if (!itemCost) {
            line.costPerUnit = 0;
            line.lineCost = 0;
            continue;
        }

        line.costPerUnit = itemCost.averageCost;
        line.lineCost = calculateLineCost(
            line.quantity,
            line.unit,
            itemCost.unit,
            itemCost.averageCost
        );
        total += line.lineCost;
    }

    return total;
}

export async function calculateRecipeCost(
    recipe: RecipeDocument,
    storeId: Types.ObjectId | string
): Promise<RecipeDocument> {
    const allLines = [
        ...recipe.ingredients,
        ...recipe.sizeVariantRecipes.flatMap((variant) => variant.ingredients),
    ];
    const costMap = await loadStorageItemCosts(storeId, allLines);

    recipe.totalIngredientCost = calculateLinesCost(recipe.ingredients, costMap);
    recipe.costPerServing =
        recipe.servings > 0
            ? recipe.totalIngredientCost / recipe.servings
            : recipe.totalIngredientCost;

    for (const variant of recipe.sizeVariantRecipes) {
        variant.totalIngredientCost = calculateLinesCost(variant.ingredients, costMap);
    }

    recipe.lastCostUpdate = new Date();
    return recipe;
}

export async function updateDishCostsFromRecipe(
    dishId: Types.ObjectId | string
): Promise<void> {
    const dish = await Dish.findById(dishId);
    const recipe = await DishRecipe.findOne({ dishId, isActive: true });

    if (!dish || !recipe) {
        return;
    }

    if (dish.hasSizeVariants && dish.sizeVariants.length > 0) {
        for (const variant of dish.sizeVariants) {
            const recipeVariant = recipe.sizeVariantRecipes.find(
                (entry) => entry.size === variant.size
            );
            variant.cost = recipeVariant?.totalIngredientCost ?? 0;
        }
    } else {
        dish.cost = recipe.totalIngredientCost || recipe.costPerServing || 0;
    }

    await dish.save();
}

export function getRecipeForSize(
    recipe: {
        ingredients: RecipeLineInput[];
        sizeVariantRecipes: SizeVariantRecipeInput[];
        totalIngredientCost: number;
    },
    size: string | null | undefined
): { ingredients: RecipeLineInput[]; totalCost: number } {
    if (!size || recipe.sizeVariantRecipes.length === 0) {
        return {
            ingredients: recipe.ingredients,
            totalCost: recipe.totalIngredientCost,
        };
    }

    const variant = recipe.sizeVariantRecipes.find((entry) => entry.size === size);
    if (variant) {
        return {
            ingredients: variant.ingredients,
            totalCost: variant.totalIngredientCost ?? 0,
        };
    }

    return {
        ingredients: recipe.ingredients,
        totalCost: recipe.totalIngredientCost,
    };
}

export async function recalculateAllRecipeCosts(
    storeId: Types.ObjectId | string
): Promise<number> {
    const recipes = await DishRecipe.find({ store: storeId, isActive: true });
    let updated = 0;

    for (const recipe of recipes) {
        await calculateRecipeCost(recipe as RecipeDocument, storeId);
        await recipe.save();
        await updateDishCostsFromRecipe(recipe.dishId);
        updated += 1;
    }

    return updated;
}
