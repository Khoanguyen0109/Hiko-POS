import dotenv from "dotenv";
import mongoose from "mongoose";

import Dish from "../models/dishModel.js";
import DishRecipe from "../models/dishRecipeModel.js";
import StorageItem from "../models/storageItemModel.js";
import Store from "../models/storeModel.js";
import {
    calculateRecipeCost,
    updateDishCostsFromRecipe,
} from "../services/recipeService.js";

dotenv.config();

const SOURCE_DISH_NAME = "Trà Xoài";
const STORE_CODE = "MAIN";

/** Batch: 25g lài + 25g đen → 2000ml. Cup: 150ml M / 200ml L */
const TEA_MEDIUM_QTY = 1.875;
const TEA_LARGE_QTY = 2.5;

const TARGETS = [
    { dishName: "Trà Cam", mutCode: "MUTCAM", syrupCode: "SYRUPCAM" },
    { dishName: "Trà Dâu", mutCode: "MUTDAU", syrupCode: "SYRUPDAU" },
    { dishName: "Trà Kiwi", mutCode: "MUTKIWI", syrupCode: "SYRUPKIWI" },
    {
        dishName: "Trà Việt Quất",
        mutCode: "MUTVIETQUOC",
        syrupCode: "SYRUPVIETQUOC",
    },
    { dishName: "Trà Vải", mutCode: "MUTVAI", syrupCode: "SYRUPVAI" },
] as const;

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findDishByName(
    storeId: mongoose.Types.ObjectId,
    name: string
) {
    return Dish.findOne({
        store: storeId,
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

function applyTeaQuantities(
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
    traLaiId: mongoose.Types.ObjectId,
    traDenId: mongoose.Types.ObjectId
) {
    return variants.map((variant) => {
        const teaQty =
            variant.size === "Large" ? TEA_LARGE_QTY : TEA_MEDIUM_QTY;

        return {
            size: variant.size,
            otherCost: variant.otherCost ?? 0,
            ingredients: cloneIngredients(variant.ingredients).map((line) => {
                const id = String(line.storageItemId);
                if (id === String(traLaiId) || id === String(traDenId)) {
                    return { ...line, quantity: teaQty, unit: "g" };
                }
                return line;
            }),
        };
    });
}

function swapFruitItems(
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
    sourceMutId: mongoose.Types.ObjectId,
    sourceSyrupId: mongoose.Types.ObjectId,
    targetMutId: mongoose.Types.ObjectId,
    targetSyrupId: mongoose.Types.ObjectId
) {
    return variants.map((variant) => ({
        size: variant.size,
        otherCost: variant.otherCost ?? 0,
        ingredients: cloneIngredients(variant.ingredients).map((line) => {
            const id = String(line.storageItemId);
            if (id === String(sourceMutId)) {
                return { ...line, storageItemId: targetMutId };
            }
            if (id === String(sourceSyrupId)) {
                return { ...line, storageItemId: targetSyrupId };
            }
            return line;
        }),
    }));
}

async function ensureDishFromTemplate(
    storeId: mongoose.Types.ObjectId,
    templateDish: {
        category: mongoose.Types.ObjectId;
        sizeVariants: Array<{
            size: string;
            price: number;
            cost?: number;
            isDefault?: boolean;
        }>;
        price: number;
    },
    name: string
) {
    let dish = await findDishByName(storeId, name);

    if (dish) {
        return dish;
    }

    dish = await Dish.create({
        store: storeId,
        name,
        category: templateDish.category,
        price: templateDish.price,
        cost: 0,
        hasSizeVariants: true,
        sizeVariants: templateDish.sizeVariants.map((variant) => ({
            size: variant.size,
            price: variant.price,
            cost: 0,
            isDefault: variant.isDefault ?? false,
        })),
        isActive: true,
    });

    console.log(`  dish created: ${name} (${dish._id})`);
    return dish;
}

async function saveRecipeForDish(
    storeId: mongoose.Types.ObjectId,
    dishId: mongoose.Types.ObjectId,
    sourceRecipe: {
        servings?: number;
        prepTime?: number;
        instructions?: string;
        notes?: string;
        otherCost?: number;
        createdBy?: { userId: mongoose.Types.ObjectId; userName: string };
        lastModifiedBy?: { userId: mongoose.Types.ObjectId; userName: string };
    },
    sizeVariantRecipes: Array<{
        size: string;
        ingredients: Array<{
            storageItemId: mongoose.Types.ObjectId;
            quantity: number;
            unit: string;
            notes?: string;
        }>;
        otherCost?: number;
    }>
) {
    let recipe = await DishRecipe.findOne({
        store: storeId,
        dishId,
    });

    const payload = {
        store: storeId,
        dishId,
        ingredients: [],
        sizeVariantRecipes,
        servings: sourceRecipe.servings ?? 1,
        prepTime: sourceRecipe.prepTime ?? 0,
        instructions: sourceRecipe.instructions ?? "",
        notes: sourceRecipe.notes ?? "",
        otherCost: sourceRecipe.otherCost ?? 0,
        isActive: true,
        createdBy: sourceRecipe.createdBy,
        lastModifiedBy:
            sourceRecipe.lastModifiedBy ?? sourceRecipe.createdBy,
    };

    if (recipe) {
        Object.assign(recipe, payload);
    } else {
        recipe = new DishRecipe(payload);
    }

    await calculateRecipeCost(recipe, String(storeId));
    await recipe.save();
    await updateDishCostsFromRecipe(dishId);
    return recipe;
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(uri);

    const store = await Store.findOne({ code: STORE_CODE });
    if (!store) {
        throw new Error(`Store not found: ${STORE_CODE}`);
    }

    const traLai = await StorageItem.findOne({
        store: store._id,
        code: "TRALAI",
    });
    const traDen = await StorageItem.findOne({
        store: store._id,
        code: "TRADEN",
    });
    const sourceMut = await StorageItem.findOne({
        store: store._id,
        code: "MUTXOAI",
    });
    const sourceSyrup = await StorageItem.findOne({
        store: store._id,
        code: "SYRUPXOAI",
    });

    if (!traLai || !traDen || !sourceMut || !sourceSyrup) {
        throw new Error("Required storage items not found on MAIN store");
    }

    const sourceDish = await findDishByName(
        store._id as mongoose.Types.ObjectId,
        SOURCE_DISH_NAME
    );
    if (!sourceDish) {
        throw new Error(`Source dish not found: ${SOURCE_DISH_NAME}`);
    }

    const sourceRecipe = await DishRecipe.findOne({
        dishId: sourceDish._id,
        isActive: true,
    }).lean();

    if (!sourceRecipe?.sizeVariantRecipes?.length) {
        throw new Error(`No recipe variants for: ${SOURCE_DISH_NAME}`);
    }

    const teaAdjustedSource = applyTeaQuantities(
        sourceRecipe.sizeVariantRecipes,
        traLai._id as mongoose.Types.ObjectId,
        traDen._id as mongoose.Types.ObjectId
    );

    console.log(`Railway store: ${store.name} (${store.code})`);
    console.log(
        `Tea qty: Medium ${TEA_MEDIUM_QTY}g, Large ${TEA_LARGE_QTY}g each (TRALAI + TRADEN)\n`
    );

    await saveRecipeForDish(
        store._id as mongoose.Types.ObjectId,
        sourceDish._id as mongoose.Types.ObjectId,
        sourceRecipe,
        teaAdjustedSource
    );
    console.log(`OK - ${SOURCE_DISH_NAME} (source updated)`);

    for (const target of TARGETS) {
        console.log(`\n=== ${target.dishName} ===`);

        const targetMut = await StorageItem.findOne({
            store: store._id,
            code: target.mutCode,
        });
        const targetSyrup = await StorageItem.findOne({
            store: store._id,
            code: target.syrupCode,
        });

        if (!targetMut || !targetSyrup) {
            console.warn(
                `SKIP - missing ${target.mutCode} or ${target.syrupCode}`
            );
            continue;
        }

        const targetDish = await ensureDishFromTemplate(
            store._id as mongoose.Types.ObjectId,
            {
                category: sourceDish.category as mongoose.Types.ObjectId,
                sizeVariants: sourceDish.sizeVariants,
                price: sourceDish.price,
            },
            target.dishName
        );

        const swapped = swapFruitItems(
            teaAdjustedSource,
            sourceMut._id as mongoose.Types.ObjectId,
            sourceSyrup._id as mongoose.Types.ObjectId,
            targetMut._id as mongoose.Types.ObjectId,
            targetSyrup._id as mongoose.Types.ObjectId
        );

        const recipe = await saveRecipeForDish(
            store._id as mongoose.Types.ObjectId,
            targetDish._id as mongoose.Types.ObjectId,
            sourceRecipe,
            swapped
        );

        const summary = recipe.sizeVariantRecipes
            .map((variant) => {
                const teaLai = variant.ingredients.find(
                    (line) =>
                        String(line.storageItemId) === String(traLai._id)
                );
                const mutLine = variant.ingredients.find(
                    (line) =>
                        String(line.storageItemId) === String(targetMut._id)
                );
                return `${variant.size}: ${(variant.totalIngredientCost ?? 0) + (variant.otherCost ?? 0)} (trà ${teaLai?.quantity ?? "?"}g, mứt ${mutLine?.quantity ?? "?"}g)`;
            })
            .join(", ");

        console.log(`  recipe OK => ${summary}`);
    }

    await mongoose.disconnect();
    console.log("\nDone.");
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
