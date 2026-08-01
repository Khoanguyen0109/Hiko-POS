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
const DISH_NAME = "Matcha Mochi";

/** Cold Whisk (Railway) + hộp mochi (no mochi viên line) */
const RECIPE = {
    Medium: {
        oatside: 140,
        matcha: 4,
        suaDac: 15,
        lyCode: "LYNHO",
        ongHutCode: "ONGHUTNHO",
    },
    Large: {
        oatside: 200,
        matcha: 5,
        suaDac: 20,
        lyCode: "LYLON",
        ongHutCode: "ONGHUTLON",
    },
} as const;

const OTHER_COST = 0;

const INSTRUCTIONS =
    "1. Pha sữa đặc + Oatside trong ly uống 2. Đánh matcha (coldwhisk) 3. Cho đá 4. Cho hỗn hợp sữa vào ly 5. Đổ matcha 6. Cho mochi matcha vào hộp riêng kèm ly";

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

    const oatside = await findStorage(storeId, "OATSIDE");
    const matcha = await findStorage(storeId, "MATCHA");
    const suaDac = await findStorage(storeId, "SUADAC");
    const hopMochi = await findStorage(storeId, "HOPDUNGMOCHI");
    const nao = await findStorage(storeId, "NAO");
    const lyNho = await findStorage(storeId, "LYNHO");
    const lyLon = await findStorage(storeId, "LYLON");
    const hopDung = await findStorage(storeId, "HOPDUNATCHA");
    const ongNho = await findStorage(storeId, "ONGHUTNHO");
    const ongLon = await findStorage(storeId, "ONGHUTLON");

    if (
        !oatside ||
        !matcha ||
        !suaDac ||
        !hopMochi ||
        !nao ||
        !lyNho ||
        !lyLon ||
        !hopDung ||
        !ongNho ||
        !ongLon
    ) {
        throw new Error("Missing required storage items on MAIN store");
    }

    const mochiViên = await findStorage(storeId, "MOCHIMATCHA");
    if (mochiViên) {
        mochiViên.isActive = false;
        await mochiViên.save();
        console.log("Deactivated MOCHIMATCHA storage item");
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

        return {
            size,
            otherCost: OTHER_COST,
            ingredients: [
                {
                    storageItemId: oatside!._id,
                    quantity: spec.oatside,
                    unit: "ml",
                    notes: "",
                },
                {
                    storageItemId: matcha!._id,
                    quantity: spec.matcha,
                    unit: "g",
                    notes: "",
                },
                {
                    storageItemId: suaDac!._id,
                    quantity: spec.suaDac,
                    unit: "ml",
                    notes: "",
                },
                {
                    storageItemId: hopMochi!._id,
                    quantity: 1,
                    unit: "piece",
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
                    storageItemId: hopDung!._id,
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
        notes: "",
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
        console.log(`  ${variant.size}: ${total.toLocaleString("vi-VN")}₫`);
    }

    await mongoose.disconnect();
    console.log("\nDone.");
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
