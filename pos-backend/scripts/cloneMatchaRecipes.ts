import dotenv from "dotenv";
import mongoose from "mongoose";

import Dish from "../models/dishModel.js";
import DishRecipe from "../models/dishRecipeModel.js";
import {
    calculateRecipeCost,
    updateDishCostsFromRecipe,
} from "../services/recipeService.js";

dotenv.config();

const SOURCE_DISH_NAME = "Matcha Cam Nha Đam";
const TARGET_DISH_NAMES = [
    "Matcha Xoài",
    "Matcha Dâu",
    "Matcha Kiwi",
    "Matcha Việt Quất",
];

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findDishByName(name: string) {
    const exact = await Dish.findOne({
        name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });
    if (exact) return exact;

    return Dish.findOne({
        name: new RegExp(escapeRegex(name), "i"),
    });
}

function cloneIngredients(lines: Array<Record<string, unknown>> = []) {
    return lines.map((line) => ({
        storageItemId: line.storageItemId,
        quantity: line.quantity,
        unit: line.unit,
        notes: line.notes || "",
    }));
}

function buildClonedRecipe(sourceRecipe: Record<string, unknown>, targetDishId: mongoose.Types.ObjectId) {
    return {
        store: sourceRecipe.store,
        dishId: targetDishId,
        ingredients: [],
        sizeVariantRecipes: (sourceRecipe.sizeVariantRecipes as Array<Record<string, unknown>>).map(
            (variant) => ({
                size: variant.size,
                ingredients: cloneIngredients(
                    variant.ingredients as Array<Record<string, unknown>>
                ),
                otherCost: variant.otherCost ?? 0,
            })
        ),
        servings: sourceRecipe.servings ?? 1,
        prepTime: sourceRecipe.prepTime ?? 0,
        instructions: sourceRecipe.instructions ?? "",
        notes: sourceRecipe.notes ?? "",
        otherCost: sourceRecipe.otherCost ?? 0,
        isActive: true,
        createdBy: sourceRecipe.createdBy,
        lastModifiedBy: sourceRecipe.createdBy,
    };
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(uri);

    const sourceDish = await findDishByName(SOURCE_DISH_NAME);
    if (!sourceDish) {
        throw new Error(`Source dish not found: ${SOURCE_DISH_NAME}`);
    }

    const sourceRecipe = await DishRecipe.findOne({
        dishId: sourceDish._id,
        isActive: true,
    }).lean();

    if (!sourceRecipe) {
        throw new Error(`No active recipe found for: ${SOURCE_DISH_NAME}`);
    }

    console.log(`Source dish: ${sourceDish.name} (${sourceDish._id})`);
    console.log(`Variants: ${sourceRecipe.sizeVariantRecipes?.length ?? 0}`);

    for (const targetName of TARGET_DISH_NAMES) {
        const targetDish = await findDishByName(targetName);
        if (!targetDish) {
            console.warn(`SKIP - dish not found: ${targetName}`);
            continue;
        }

        const payload = buildClonedRecipe(sourceRecipe, targetDish._id);

        let recipe = await DishRecipe.findOne({
            store: payload.store,
            dishId: targetDish._id,
        });

        if (recipe) {
            Object.assign(recipe, payload);
        } else {
            recipe = new DishRecipe(payload);
        }

        await calculateRecipeCost(recipe, String(payload.store));
        await recipe.save();
        await updateDishCostsFromRecipe(targetDish._id);

        const variantSummary = recipe.sizeVariantRecipes
            .map(
                (variant) =>
                    `${variant.size}: ${(variant.totalIngredientCost ?? 0) + (variant.otherCost ?? 0)}`
            )
            .join(", ");

        console.log(`OK - ${targetName} (${targetDish._id}) => ${variantSummary}`);
    }

    await mongoose.disconnect();
    console.log("\nDone.");
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
