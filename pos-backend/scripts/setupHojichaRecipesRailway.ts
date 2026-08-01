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
const OTHER_COST = 2000;

/** From Công thức chuẩn Hiko Matcha.xlsx — Houjicha section */
const RECIPES = {
    "Hojicha": {
        instructions:
            "1. Pha sữa đặc + Sữa Tươi (trong ly khách) 2. Đánh Hojicha(latte) 3. Cho đá vào ly 4. Đổ Hojicha (nhớ vét sạch)",
        Medium: { hojicha: 4, suaDac: 15, suaTuoi: 100 },
        Large: { hojicha: 5, suaDac: 20, suaTuoi: 150 },
    },
    "Hojicha Coldwhisk": {
        instructions:
            "1. Pha sữa đặc + Sữa tươi (trong ly khách) 2. Đánh Hojicha (coldwhisk) trong ly đong lớn 3. Cho đá vào ly 4. Đổ Hojicha(nhớ vét sạch)",
        Medium: { hojicha: 5, suaDac: 15, suaTuoi: 100 },
        Large: { hojicha: 6, suaDac: 20, suaTuoi: 150 },
    },
} as const;

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findStorage(
    storeId: mongoose.Types.ObjectId,
    code: string
) {
    return StorageItem.findOne({ store: storeId, code });
}

async function findDish(name: string) {
    return (
        (await Dish.findOne({
            name: new RegExp(`^${escapeRegex(name)}$`, "i"),
        })) ??
        (await Dish.findOne({
            name: new RegExp(escapeRegex(name), "i"),
        }))
    );
}

async function setupRecipe(
    storeId: mongoose.Types.ObjectId,
    dishName: keyof typeof RECIPES,
    hojicha: mongoose.Document,
    suaDac: mongoose.Document,
    suaTuoi: mongoose.Document,
    lyNho: mongoose.Document,
    lyLon: mongoose.Document,
    nao: mongoose.Document,
    hopDung: mongoose.Document,
    ongNho: mongoose.Document,
    ongLon: mongoose.Document
) {
    const spec = RECIPES[dishName];
    const dish = await findDish(dishName);

    if (!dish) {
        console.warn(`SKIP ${dishName} - dish not found`);
        return;
    }

    if (!dish.store) {
        dish.store = storeId;
        await dish.save();
    }

    function buildVariant(size: "Medium" | "Large") {
        const qty = spec[size];
        const ly = size === "Medium" ? lyNho : lyLon;
        const ong = size === "Medium" ? ongNho : ongLon;

        return {
            size,
            otherCost: OTHER_COST,
            ingredients: [
                {
                    storageItemId: hojicha._id,
                    quantity: qty.hojicha,
                    unit: "g",
                    notes: "",
                },
                {
                    storageItemId: suaDac._id,
                    quantity: qty.suaDac,
                    unit: "ml",
                    notes: "",
                },
                {
                    storageItemId: suaTuoi._id,
                    quantity: qty.suaTuoi,
                    unit: "ml",
                    notes: "",
                },
                {
                    storageItemId: ly._id,
                    quantity: 1,
                    unit: "piece",
                    notes: "",
                },
                {
                    storageItemId: nao._id,
                    quantity: 1,
                    unit: "piece",
                    notes: "",
                },
                {
                    storageItemId: hopDung._id,
                    quantity: 1,
                    unit: "piece",
                    notes: "",
                },
                {
                    storageItemId: ong._id,
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
        instructions: spec.instructions,
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

    console.log(`\n${dish.name}:`);
    for (const variant of recipe.sizeVariantRecipes) {
        const total =
            (variant.totalIngredientCost ?? 0) + (variant.otherCost ?? 0);
        const h = variant.ingredients.find(
            (line) => String(line.storageItemId) === String(hojicha._id)
        );
        const d = variant.ingredients.find(
            (line) => String(line.storageItemId) === String(suaDac._id)
        );
        const t = variant.ingredients.find(
            (line) => String(line.storageItemId) === String(suaTuoi._id)
        );
        console.log(
            `  ${variant.size}: ${total.toLocaleString("vi-VN")}₫ — HOUJICHA ${h?.quantity}g, SUADAC ${d?.quantity}ml, SUATUOI ${t?.quantity}ml`
        );
    }
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

    const hojicha = await findStorage(storeId, "HOUJICHA");
    const suaDac = await findStorage(storeId, "SUADAC");
    const suaTuoi = await findStorage(storeId, "SUATUOI");
    const lyNho = await findStorage(storeId, "LYNHO");
    const lyLon = await findStorage(storeId, "LYLON");
    const nao = await findStorage(storeId, "NAO");
    const hopDung = await findStorage(storeId, "HOPDUNATCHA");
    const ongNho = await findStorage(storeId, "ONGHUTNHO");
    const ongLon = await findStorage(storeId, "ONGHUTLON");

    if (
        !hojicha ||
        !suaDac ||
        !suaTuoi ||
        !lyNho ||
        !lyLon ||
        !nao ||
        !hopDung ||
        !ongNho ||
        !ongLon
    ) {
        throw new Error("Missing required storage items on MAIN store");
    }

    for (const dishName of Object.keys(RECIPES) as Array<
        keyof typeof RECIPES
    >) {
        await setupRecipe(
            storeId,
            dishName,
            hojicha,
            suaDac,
            suaTuoi,
            lyNho,
            lyLon,
            nao,
            hopDung,
            ongNho,
            ongLon
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
