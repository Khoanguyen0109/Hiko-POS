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

const TRAPHA_MEDIUM_ML = 150;
const TRAPHA_LARGE_ML = 200;

const FRUIT_TRA_NAMES = [
    "Trà Xoài",
    "Trà Cam",
    "Trà Dâu",
    "Trà Kiwi",
    "Trà Việt Quất",
    "Trà Vải",
];

const MACHIATO_NAMES = ["Trà Lài Machiato", "Trà lài Machiato"];

const TRA001_NAMES = ["Trà trái cây", "Trà mơ"];

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

async function ensureTraPha(
    storeId: mongoose.Types.ObjectId,
    traLai: { averageCost: number; contentQuantity?: number },
    traDen: { averageCost: number; contentQuantity?: number }
) {
    const laiPerG = traLai.averageCost / (traLai.contentQuantity || 1000);
    const denPerG = traDen.averageCost / (traDen.contentQuantity || 1000);
    const costPerMl = (25 * laiPerG + 25 * denPerG) / 2000;

    let item = await StorageItem.findOne({ store: storeId, code: "TRAPHA" });
    if (item) {
        item.unit = "ml";
        item.name = "Trà pha (lài + đen)";
        item.averageCost = Math.round(costPerMl * 100) / 100;
        item.isActive = true;
        await item.save();
        return item;
    }

    return StorageItem.create({
        store: storeId,
        code: "TRAPHA",
        name: "Trà pha (lài + đen)",
        unit: "ml",
        category: "Ingredient",
        averageCost: Math.round(costPerMl * 100) / 100,
        currentStock: 0,
        minStock: 0,
        maxStock: 10000,
        isActive: true,
    });
}

function replaceTeaWithTraPha(
    variant: {
        size: string;
        ingredients: Array<{
            storageItemId: mongoose.Types.ObjectId;
            quantity: number;
            unit: string;
            notes?: string;
        }>;
    },
    traPhaId: mongoose.Types.ObjectId,
    traLaiId: mongoose.Types.ObjectId,
    traDenId: mongoose.Types.ObjectId,
    nuocDuongId: mongoose.Types.ObjectId | null,
    tra001Id?: mongoose.Types.ObjectId | null
) {
    const qty = variant.size === "Large" ? TRAPHA_LARGE_ML : TRAPHA_MEDIUM_ML;
    const skipIds = new Set(
        [traLaiId, traDenId, tra001Id, traPhaId]
            .filter(Boolean)
            .map((id) => String(id))
    );

    const kept = variant.ingredients.filter(
        (line) => !skipIds.has(String(line.storageItemId))
    );

    const traLine = {
        storageItemId: traPhaId,
        quantity: qty,
        unit: "ml",
        notes: "",
    };

    const duongIdx = nuocDuongId
        ? kept.findIndex(
              (line) => String(line.storageItemId) === String(nuocDuongId)
          )
        : -1;

    if (duongIdx >= 0) {
        kept.splice(duongIdx + 1, 0, traLine);
    } else {
        kept.unshift(traLine);
    }

    variant.ingredients = kept;
}

function setTraPhaQuantity(
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
    traPhaId: mongoose.Types.ObjectId
) {
    for (const variant of recipe.sizeVariantRecipes) {
        const qty =
            variant.size === "Large" ? TRAPHA_LARGE_ML : TRAPHA_MEDIUM_ML;
        for (const line of variant.ingredients) {
            if (String(line.storageItemId) === String(traPhaId)) {
                line.quantity = qty;
                line.unit = "ml";
            }
        }
    }
}

async function updateRecipeTea(
    storeId: mongoose.Types.ObjectId,
    dishName: string,
    traPha: mongoose.Document,
    traLai: mongoose.Document,
    traDen: mongoose.Document,
    nuocDuong: mongoose.Document | null,
    tra001: mongoose.Document | null,
    mode: "replace" | "set"
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
        if (mode === "replace") {
            replaceTeaWithTraPha(
                variant,
                traPha._id as mongoose.Types.ObjectId,
                traLai._id as mongoose.Types.ObjectId,
                traDen._id as mongoose.Types.ObjectId,
                nuocDuong?._id as mongoose.Types.ObjectId | null,
                tra001?._id as mongoose.Types.ObjectId | null
            );
        }
    }

    if (mode === "set") {
        setTraPhaQuantity(
            recipe,
            traPha._id as mongoose.Types.ObjectId
        );
    }

    await calculateRecipeCost(recipe, String(storeId));
    await recipe.save();
    await updateDishCostsFromRecipe(dish._id);

    const m = recipe.sizeVariantRecipes.find((v) => v.size === "Medium");
    const l = recipe.sizeVariantRecipes.find((v) => v.size === "Large");
    const mTra = m?.ingredients.find(
        (line) => String(line.storageItemId) === String(traPha._id)
    );
    const lTra = l?.ingredients.find(
        (line) => String(line.storageItemId) === String(traPha._id)
    );

    console.log(
        `OK ${dish.name} => trà M ${mTra?.quantity}ml / L ${lTra?.quantity}ml (cost M ${Math.round((m?.totalIngredientCost ?? 0) + (m?.otherCost ?? 0))} / L ${Math.round((l?.totalIngredientCost ?? 0) + (l?.otherCost ?? 0))})`
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

    const traPha = await ensureTraPha(storeId, traLai, traDen);

    console.log(
        `Trà production: M ${TRAPHA_MEDIUM_ML}ml / L ${TRAPHA_LARGE_ML}ml (TRAPHA @ ${traPha.averageCost}/ml)\n`
    );

    for (const dishName of FRUIT_TRA_NAMES) {
        await updateRecipeTea(
            storeId,
            dishName,
            traPha,
            traLai,
            traDen,
            nuocDuong,
            tra001,
            "replace"
        );
    }

    for (const dishName of TRA001_NAMES) {
        await updateRecipeTea(
            storeId,
            dishName,
            traPha,
            traLai,
            traDen,
            nuocDuong,
            tra001,
            "replace"
        );
    }

    for (const dishName of MACHIATO_NAMES) {
        const dish = await findDishByName(storeId, dishName);
        if (!dish) continue;
        await updateRecipeTea(
            storeId,
            dishName,
            traPha,
            traLai,
            traDen,
            nuocDuong,
            tra001,
            "set"
        );
        break;
    }

    await mongoose.disconnect();
    console.log("\nDone.");
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
