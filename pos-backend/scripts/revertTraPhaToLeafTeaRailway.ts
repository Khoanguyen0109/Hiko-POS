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

const STORE_CODE = "MAIN";

/** Batch: 25g lài + 25g đen → 2000ml. Cup: 150ml M / 200ml L */
const TEA_MEDIUM_QTY = 1.875;
const TEA_LARGE_QTY = 2.5;

const DISH_NAMES = [
    "Trà Xoài",
    "Trà Cam",
    "Trà Dâu",
    "Trà Kiwi",
    "Trà Việt Quất",
    "Trà Vải",
    "Trà trái cây",
    "Trà mơ",
    "Trà Lài Machiato",
    "Trà lài Machiato",
];

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

function replaceBrewedTeaWithLeafTea(
    variant: {
        size: string;
        ingredients: Array<{
            storageItemId: mongoose.Types.ObjectId;
            quantity: number;
            unit: string;
            notes?: string;
        }>;
    },
    traLaiId: mongoose.Types.ObjectId,
    traDenId: mongoose.Types.ObjectId,
    nuocDuongId: mongoose.Types.ObjectId | null,
    skipIds: Set<string>
) {
    const teaQty = variant.size === "Large" ? TEA_LARGE_QTY : TEA_MEDIUM_QTY;

    const kept = variant.ingredients.filter(
        (line) => !skipIds.has(String(line.storageItemId))
    );

    const traLines = [
        {
            storageItemId: traLaiId,
            quantity: teaQty,
            unit: "g",
            notes: "",
        },
        {
            storageItemId: traDenId,
            quantity: teaQty,
            unit: "g",
            notes: "",
        },
    ];

    const duongIdx = nuocDuongId
        ? kept.findIndex(
              (line) => String(line.storageItemId) === String(nuocDuongId)
          )
        : -1;

    if (duongIdx >= 0) {
        kept.splice(duongIdx + 1, 0, ...traLines);
    } else {
        kept.unshift(...traLines);
    }

    variant.ingredients = kept;
}

function ensureLeafTeaInVariant(
    variant: {
        size: string;
        ingredients: Array<{
            storageItemId: mongoose.Types.ObjectId;
            quantity: number;
            unit: string;
            notes?: string;
        }>;
    },
    traLaiId: mongoose.Types.ObjectId,
    traDenId: mongoose.Types.ObjectId,
    nuocDuongId: mongoose.Types.ObjectId | null
) {
    const hasLai = variant.ingredients.some(
        (line) => String(line.storageItemId) === String(traLaiId)
    );
    const hasDen = variant.ingredients.some(
        (line) => String(line.storageItemId) === String(traDenId)
    );
    if (hasLai && hasDen) {
        return;
    }

    const teaQty = variant.size === "Large" ? TEA_LARGE_QTY : TEA_MEDIUM_QTY;
    const traLines = [
        {
            storageItemId: traLaiId,
            quantity: teaQty,
            unit: "g",
            notes: "",
        },
        {
            storageItemId: traDenId,
            quantity: teaQty,
            unit: "g",
            notes: "",
        },
    ];

    const duongIdx = nuocDuongId
        ? variant.ingredients.findIndex(
              (line) => String(line.storageItemId) === String(nuocDuongId)
          )
        : -1;

    if (duongIdx >= 0) {
        variant.ingredients.splice(duongIdx + 1, 0, ...traLines);
    } else {
        variant.ingredients.unshift(...traLines);
    }
}

function setLeafTeaQuantities(
    recipe: {
        sizeVariantRecipes: Array<{
            size: string;
            ingredients: Array<{
                storageItemId: mongoose.Types.ObjectId;
                quantity: number;
                unit: string;
            }>;
        }>;
    },
    traLaiId: mongoose.Types.ObjectId,
    traDenId: mongoose.Types.ObjectId
) {
    for (const variant of recipe.sizeVariantRecipes) {
        const teaQty =
            variant.size === "Large" ? TEA_LARGE_QTY : TEA_MEDIUM_QTY;
        for (const line of variant.ingredients) {
            const id = String(line.storageItemId);
            if (id === String(traLaiId) || id === String(traDenId)) {
                line.quantity = teaQty;
                line.unit = "g";
            }
        }
    }
}

async function updateRecipe(
    storeId: mongoose.Types.ObjectId,
    dishName: string,
    traLai: mongoose.Document,
    traDen: mongoose.Document,
    nuocDuong: mongoose.Document | null,
    skipIds: Set<string>
) {
    const dish = await findDishByName(storeId, dishName);
    if (!dish) {
        console.warn(`SKIP ${dishName} - dish not found`);
        return;
    }

    const recipe = await DishRecipe.findOne({
        dishId: dish._id,
        isActive: true,
    });

    if (!recipe) {
        console.warn(`SKIP ${dishName} - no recipe`);
        return;
    }


    for (const variant of recipe.sizeVariantRecipes) {
        const hasSkip = variant.ingredients.some((line) =>
            skipIds.has(String(line.storageItemId))
        );
        if (hasSkip) {
            replaceBrewedTeaWithLeafTea(
                variant,
                traLai._id as mongoose.Types.ObjectId,
                traDen._id as mongoose.Types.ObjectId,
                nuocDuong?._id as mongoose.Types.ObjectId | null,
                skipIds
            );
        }
        ensureLeafTeaInVariant(
            variant,
            traLai._id as mongoose.Types.ObjectId,
            traDen._id as mongoose.Types.ObjectId,
            nuocDuong?._id as mongoose.Types.ObjectId | null
        );
    }

    setLeafTeaQuantities(
        recipe,
        traLai._id as mongoose.Types.ObjectId,
        traDen._id as mongoose.Types.ObjectId
    );

    await calculateRecipeCost(recipe, String(storeId));
    await recipe.save();
    await updateDishCostsFromRecipe(dish._id);

    const m = recipe.sizeVariantRecipes.find((v) => v.size === "Medium");
    const l = recipe.sizeVariantRecipes.find((v) => v.size === "Large");
    const mLai = m?.ingredients.find(
        (line) => String(line.storageItemId) === String(traLai._id)
    );
    const lLai = l?.ingredients.find(
        (line) => String(line.storageItemId) === String(traLai._id)
    );

    console.log(
        `OK ${dish.name} => TRALAI+TRADEN M ${mLai?.quantity}g / L ${lLai?.quantity}g`
    );
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

    const storeId = store._id as mongoose.Types.ObjectId;

    const traLai = await StorageItem.findOne({
        store: storeId,
        code: "TRALAI",
    });
    const traDen = await StorageItem.findOne({
        store: storeId,
        code: "TRADEN",
    });
    const traPha = await StorageItem.findOne({
        store: storeId,
        code: "TRAPHA",
    });
    const tra001 = await StorageItem.findOne({
        store: storeId,
        code: "TRA001",
    });
    const nuocDuong = await StorageItem.findOne({
        store: storeId,
        code: "NUOCDUONG",
    });

    if (!traLai || !traDen) {
        throw new Error("TRALAI or TRADEN not found");
    }

    const skipIds = new Set(
        [traPha?._id, tra001?._id]
            .filter(Boolean)
            .map((id) => String(id))
    );

    console.log(
        `Replacing brewed tea with TRALAI + TRADEN (M ${TEA_MEDIUM_QTY}g / L ${TEA_LARGE_QTY}g each)\n`
    );

    const seenDishes = new Set<string>();
    for (const dishName of DISH_NAMES) {
        const dish = await findDishByName(storeId, dishName);
        if (!dish || seenDishes.has(String(dish._id))) continue;
        seenDishes.add(String(dish._id));
        await updateRecipe(
            storeId,
            dishName,
            traLai,
            traDen,
            nuocDuong,
            skipIds
        );
    }

    if (traPha) {
        traPha.isActive = false;
        await traPha.save();
        console.log("\nDeactivated TRAPHA storage item");
    }

    await mongoose.disconnect();
    console.log("\nDone.");
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
