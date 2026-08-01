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

const SOURCE_DISH_NAME = "Trà trái cây";

const FRUIT_DRINKS = [
    { dishName: "Trà Xoài", mutCode: "MUT_XOAI", mutName: "Mứt xoài" },
    { dishName: "Trà Cam", mutCode: "MUT_CAM", mutName: "Mứt cam" },
    { dishName: "Trà Dâu", mutCode: "MUT_DAU", mutName: "Mứt dâu" },
    { dishName: "Trà Kiwi", mutCode: "MUT_KIWI", mutName: "Mứt kiwi" },
    { dishName: "Trà Việt Quất", mutCode: "MUT_VQ", mutName: "Mứt việt quất" },
] as const;

const UPDATED_INSTRUCTIONS =
    "1. Cho mứt vào đáy ly 2. Nước đường vào ly uống 3. Syrup 4. Trà 5. Dùng cây sục hỗn hợp đều 6. Cho đá 7. 1 lát chanh 8. 1 lá húng lủi 9. Củ năng";

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findDishByName(name: string) {
    return Dish.findOne({
        name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });
}

function cloneIngredients(
    lines: Array<{
        storageItemId: mongoose.Types.ObjectId;
        quantity: number;
        unit: string;
        notes?: string;
    }> = []
) {
    return lines.map((line) => ({
        storageItemId: line.storageItemId,
        quantity: line.quantity,
        unit: line.unit,
        notes: line.notes || "",
    }));
}

function swapMutInRecipe(
    variants: Array<{
        size: string;
        ingredients: Array<{
            storageItemId: mongoose.Types.ObjectId;
            quantity: number;
            unit: string;
            notes?: string;
        }>;
        otherCost?: number;
    }>,
    genericMutId: mongoose.Types.ObjectId,
    fruitMutId: mongoose.Types.ObjectId
) {
    return variants.map((variant) => ({
        size: variant.size,
        otherCost: variant.otherCost ?? 0,
        ingredients: cloneIngredients(variant.ingredients).map((line) => {
            if (String(line.storageItemId) === String(genericMutId)) {
                return { ...line, storageItemId: fruitMutId };
            }
            return line;
        }),
    }));
}

async function ensureStorageItem(
    storeId: mongoose.Types.ObjectId,
    code: string,
    name: string,
    averageCost: number
) {
    let item = await StorageItem.findOne({ store: storeId, code });

    if (item) {
        item.name = name;
        item.unit = "g";
        item.category = "Ingredient";
        item.isActive = true;
        if (!item.averageCost) {
            item.averageCost = averageCost;
        }
        await item.save();
        console.log(`  storage exists: ${code} (${item._id})`);
        return item;
    }

    item = await StorageItem.create({
        store: storeId,
        code,
        name,
        unit: "g",
        category: "Ingredient",
        averageCost,
        currentStock: 0,
        minStock: 0,
        maxStock: 1000,
        isActive: true,
    });
    console.log(`  storage created: ${code} (${item._id})`);
    return item;
}

async function ensureDish(
    storeId: mongoose.Types.ObjectId,
    categoryId: mongoose.Types.ObjectId,
    name: string,
    sizeVariants: Array<{
        size: string;
        price: number;
        cost: number;
        isDefault: boolean;
    }>
) {
    let dish = await findDishByName(name);

    if (dish) {
        dish.category = categoryId;
        dish.hasSizeVariants = true;
        dish.sizeVariants = sizeVariants;
        dish.price = sizeVariants.find((v) => v.isDefault)?.price ?? sizeVariants[0].price;
        dish.isActive = true;
        await dish.save();
        console.log(`  dish exists: ${name} (${dish._id})`);
        return dish;
    }

    dish = await Dish.create({
        store: storeId,
        name,
        category: categoryId,
        price: sizeVariants.find((v) => v.isDefault)?.price ?? sizeVariants[0].price,
        cost: 0,
        hasSizeVariants: true,
        sizeVariants,
        isActive: true,
    });
    console.log(`  dish created: ${name} (${dish._id})`);
    return dish;
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
    });

    if (!sourceRecipe) {
        throw new Error(`No active recipe for: ${SOURCE_DISH_NAME}`);
    }

    const storeId = sourceDish.store as mongoose.Types.ObjectId;
    const categoryId = sourceDish.category as mongoose.Types.ObjectId;

    const genericMut = await StorageItem.findOne({
        store: storeId,
        code: "MUT001",
    });

    if (!genericMut) {
        throw new Error("MUT001 not found for store");
    }

    const mutCost = genericMut.averageCost || 80;

    sourceRecipe.instructions = UPDATED_INSTRUCTIONS;
    await sourceRecipe.save();

    const sizeVariants = (sourceDish.sizeVariants ?? []).map((variant) => ({
        size: variant.size,
        price: variant.price,
        cost: variant.cost ?? 0,
        isDefault: variant.isDefault ?? false,
    }));

    console.log(`Store: ${storeId}`);
    console.log(`Category: ${categoryId}`);
    console.log(`Source: ${sourceDish.name}\n`);

    for (const entry of FRUIT_DRINKS) {
        console.log(`\n=== ${entry.dishName} ===`);

        const mutItem = await ensureStorageItem(
            storeId,
            entry.mutCode,
            entry.mutName,
            mutCost
        );

        const dish = await ensureDish(
            storeId,
            categoryId,
            entry.dishName,
            sizeVariants
        );

        const variantRecipes = swapMutInRecipe(
            sourceRecipe.sizeVariantRecipes,
            genericMut._id as mongoose.Types.ObjectId,
            mutItem._id as mongoose.Types.ObjectId
        );

        let recipe = await DishRecipe.findOne({
            store: storeId,
            dishId: dish._id,
        });

        const payload = {
            store: storeId,
            dishId: dish._id,
            ingredients: [],
            sizeVariantRecipes: variantRecipes,
            servings: sourceRecipe.servings ?? 1,
            prepTime: sourceRecipe.prepTime ?? 0,
            instructions: UPDATED_INSTRUCTIONS,
            notes: sourceRecipe.notes ?? "",
            otherCost: sourceRecipe.otherCost ?? 0,
            isActive: true,
            createdBy: sourceRecipe.createdBy,
            lastModifiedBy: sourceRecipe.lastModifiedBy,
        };

        if (recipe) {
            Object.assign(recipe, payload);
        } else {
            recipe = new DishRecipe(payload);
        }

        await calculateRecipeCost(recipe, String(storeId));
        await recipe.save();
        await updateDishCostsFromRecipe(dish._id);

        const summary = recipe.sizeVariantRecipes
            .map((variant) => {
                const mutLine = variant.ingredients.find(
                    (line) => String(line.storageItemId) === String(mutItem._id)
                );
                return `${variant.size}: ${(variant.totalIngredientCost ?? 0) + (variant.otherCost ?? 0)} (mứt ${mutLine?.quantity ?? "?"}g)`;
            })
            .join(", ");

        console.log(`  recipe OK => ${summary}`);
    }

    await mongoose.disconnect();
    console.log("\nDone. Created/updated 5 mứt items, 5 Trà dishes, and 5 recipes.");
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
