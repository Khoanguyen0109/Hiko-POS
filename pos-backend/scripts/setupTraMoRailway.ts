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
const DISH_NAME = "Trà mơ";

/** Batch: 25g lài + 25g đen → 2000ml. Cup: 150ml M / 200ml L */
const TEA_MEDIUM_QTY = 1.875;
const TEA_LARGE_QTY = 2.5;
const OTHER_COST = 4000;

const RECIPE = {
    Medium: {
        nuocDuong: 5,
        lyCode: "LYNHO",
        ongHutCode: "ONGHUTNHO",
    },
    Large: {
        nuocDuong: 10,
        lyCode: "LYLON",
        ongHutCode: "ONGHUTLON",
    },
} as const;

const INSTRUCTIONS = "Làm như trà bình thường. Không cho tắc";

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findStorage(
    storeId: mongoose.Types.ObjectId,
    code: string
) {
    return StorageItem.findOne({ store: storeId, code });
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

    const traLai = await findStorage(storeId, "TRALAI");
    const traDen = await findStorage(storeId, "TRADEN");
    const nuocDuong = await findStorage(storeId, "NUOCDUONG");
    const nao = await findStorage(storeId, "NAO");
    const lyNho = await findStorage(storeId, "LYNHO");
    const lyLon = await findStorage(storeId, "LYLON");
    const ongNho = await findStorage(storeId, "ONGHUTNHO");
    const ongLon = await findStorage(storeId, "ONGHUTLON");

    if (
        !traLai ||
        !traDen ||
        !nuocDuong ||
        !nao ||
        !lyNho ||
        !lyLon ||
        !ongNho ||
        !ongLon
    ) {
        throw new Error("Missing required storage items on MAIN store");
    }

    const dish =
        (await Dish.findOne({
            store: storeId,
            name: new RegExp(`^${escapeRegex(DISH_NAME)}$`, "i"),
        })) ??
        (await Dish.findOne({
            name: new RegExp(`^${escapeRegex(DISH_NAME)}$`, "i"),
        }));

    if (!dish) {
        throw new Error(`Dish not found: ${DISH_NAME}`);
    }

    if (!dish.store) {
        dish.store = storeId;
        await dish.save();
    }

    console.log(`Dish: ${dish.name} (${dish._id})`);

    function buildVariant(size: "Medium" | "Large") {
        const spec = RECIPE[size];
        const ly = size === "Medium" ? lyNho : lyLon;
        const ong = size === "Medium" ? ongNho : ongLon;
        const teaQty = size === "Large" ? TEA_LARGE_QTY : TEA_MEDIUM_QTY;

        return {
            size,
            otherCost: OTHER_COST,
            ingredients: [
                {
                    storageItemId: nuocDuong!._id,
                    quantity: spec.nuocDuong,
                    unit: "ml",
                    notes: "",
                },
                {
                    storageItemId: traLai!._id,
                    quantity: teaQty,
                    unit: "g",
                    notes: "",
                },
                {
                    storageItemId: traDen!._id,
                    quantity: teaQty,
                    unit: "g",
                    notes: "",
                },
                {
                    storageItemId: ly!._id,
                    quantity: 1,
                    unit: "piece",
                    notes: "",
                },
                {
                    storageItemId: nao!._id,
                    quantity: 1,
                    unit: "piece",
                    notes: "",
                },
                {
                    storageItemId: ong!._id,
                    quantity: 1,
                    unit: "piece",
                    notes: "",
                },
            ],
        };
    }

    const sizeVariantRecipes = [
        buildVariant("Medium"),
        buildVariant("Large"),
    ];

    let recipe = await DishRecipe.findOne({
        store: storeId,
        dishId: dish._id,
    });

    const payload = {
        store: storeId,
        dishId: dish._id,
        ingredients: [],
        sizeVariantRecipes,
        servings: 1,
        prepTime: 0,
        instructions: INSTRUCTIONS,
        notes: "Không syrup mơ",
        otherCost: 0,
        isActive: true,
    };

    if (recipe) {
        Object.assign(recipe, payload);
    } else {
        recipe = new DishRecipe(payload);
    }

    await calculateRecipeCost(recipe, String(storeId));
    await recipe.save();
    await updateDishCostsFromRecipe(dish._id);

    console.log("\nRecipe saved:");
    for (const variant of recipe.sizeVariantRecipes) {
        const total =
            (variant.totalIngredientCost ?? 0) + (variant.otherCost ?? 0);
        console.log(
            `  ${variant.size}: ${total.toLocaleString("vi-VN")}₫ (other ${variant.otherCost}₫)`
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
