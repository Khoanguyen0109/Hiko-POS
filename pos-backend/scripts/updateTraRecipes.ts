import dotenv from "dotenv";
import mongoose from "mongoose";

import Dish from "../models/dishModel.js";
import DishRecipe from "../models/dishRecipeModel.js";
import StorageItem from "../models/storageItemModel.js";
import {
    calculateRecipeCost,
    updateDishCostsFromRecipe,
} from "../services/recipeService.js";

dotenv.config();

const TRA_DISH_NAMES = [
    "Trà trái cây",
    "Trà mơ",
    "Trà lài Machiato",
];

const CU_NANG_BY_SIZE: Record<string, number> = {
    Medium: 20,
    Large: 30,
};

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findDishByName(name: string) {
    return Dish.findOne({
        name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });
}

async function updateRecipe(
    dishName: string,
    tacId: mongoose.Types.ObjectId,
    cuNangId: mongoose.Types.ObjectId
) {
    const dish = await findDishByName(dishName);
    if (!dish) {
        console.warn(`SKIP - dish not found: ${dishName}`);
        return;
    }

    const recipe = await DishRecipe.findOne({
        dishId: dish._id,
        isActive: true,
    });

    if (!recipe) {
        console.warn(`SKIP - no recipe: ${dishName}`);
        return;
    }

    for (const variant of recipe.sizeVariantRecipes) {
        variant.ingredients = variant.ingredients.filter(
            (line) => String(line.storageItemId) !== String(tacId)
        );

        const cuNangLine = variant.ingredients.find(
            (line) => String(line.storageItemId) === String(cuNangId)
        );

        if (cuNangLine) {
            cuNangLine.quantity = CU_NANG_BY_SIZE[variant.size] ?? cuNangLine.quantity;
            cuNangLine.unit = "g";
            cuNangLine.notes = "";
        }
    }

    await calculateRecipeCost(recipe, String(recipe.store));
    await recipe.save();
    await updateDishCostsFromRecipe(dish._id);

    const summary = recipe.sizeVariantRecipes
        .map(
            (variant) =>
                `${variant.size}: ${(variant.totalIngredientCost ?? 0) + (variant.otherCost ?? 0)}`
        )
        .join(", ");

    console.log(`OK - ${dishName} => ${summary}`);
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(uri);

    const tac = await StorageItem.findOne({ code: "TAC001" });
    const cuNang = await StorageItem.findOne({ code: "CU_NANG" });

    if (!cuNang) {
        throw new Error("CU_NANG storage item not found");
    }

    // 5000/piece × 0.5 piece = 2500 for old M; 20g M => 125/g if 1 piece ≈ 40g
    if (cuNang.unit !== "g") {
        const costPerGram =
            cuNang.unit === "piece" && cuNang.averageCost > 0
                ? Math.round(cuNang.averageCost / 40)
                : cuNang.averageCost;

        cuNang.unit = "g";
        cuNang.averageCost = costPerGram;
        await cuNang.save();
        console.log(`Updated CU_NANG storage to g @ ${costPerGram}/g`);
    }

    for (const dishName of TRA_DISH_NAMES) {
        await updateRecipe(
            dishName,
            tac?._id as mongoose.Types.ObjectId,
            cuNang._id as mongoose.Types.ObjectId
        );
    }

    await mongoose.disconnect();
    console.log("\nDone.");
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
