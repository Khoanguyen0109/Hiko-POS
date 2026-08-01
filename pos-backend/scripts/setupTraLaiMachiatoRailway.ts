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
const DISH_NAME = "Trà Lài Machiato";

const RECIPE = {
    Medium: {
        nuocDuong: 25,
        traPha: 150,
        kemMuoi: 20,
        lyCode: "LYNHO",
        ongHutCode: "ONGHUTNHO",
    },
    Large: {
        nuocDuong: 30,
        traPha: 200,
        kemMuoi: 30,
        lyCode: "LYLON",
        ongHutCode: "ONGHUTLON",
    },
} as const;

const OTHER_COST = 2000;

const INSTRUCTIONS =
    "1. Cho nước đường vào ly uống 2. Cho trà vào 3. Dùng cây sục hỗn hợp đều 4. Cho đá 5. Cho kem muối lên top 6. Cho củ năng lên trên kem muối 7. 1 ngọn húng lủi 8. 1 lát chanh trên top";

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findStorage(
    storeId: mongoose.Types.ObjectId,
    code: string
) {
    return StorageItem.findOne({ store: storeId, code });
}

async function ensureStorageItem(
    storeId: mongoose.Types.ObjectId,
    spec: {
        code: string;
        name: string;
        unit: string;
        averageCost: number;
        contentQuantity?: number;
        contentUnit?: string;
    }
) {
    let item = await StorageItem.findOne({ store: storeId, code: spec.code });

    if (item) {
        item.name = spec.name;
        item.unit = spec.unit;
        item.category = "Ingredient";
        item.isActive = true;
        if (spec.contentQuantity) {
            item.contentQuantity = spec.contentQuantity;
            item.contentUnit = spec.contentUnit || "";
        }
        if (!item.averageCost) {
            item.averageCost = spec.averageCost;
        }
        await item.save();
        console.log(`  storage exists: ${spec.code}`);
        return item;
    }

    item = await StorageItem.create({
        store: storeId,
        code: spec.code,
        name: spec.name,
        unit: spec.unit,
        category: "Ingredient",
        averageCost: spec.averageCost,
        contentQuantity: spec.contentQuantity ?? 0,
        contentUnit: spec.contentUnit ?? "",
        currentStock: 0,
        minStock: 0,
        maxStock: 1000,
        isActive: true,
    });
    console.log(`  storage created: ${spec.code}`);
    return item;
}

function computeTraPhaCostPerMl(
    traLai: { averageCost: number; contentQuantity?: number },
    traDen: { averageCost: number; contentQuantity?: number }
): number {
    const laiPerG = traLai.averageCost / (traLai.contentQuantity || 1000);
    const denPerG = traDen.averageCost / (traDen.contentQuantity || 1000);
    const batchCost = 25 * laiPerG + 25 * denPerG;
    return Math.round((batchCost / 2000) * 100) / 100;
}

function computeKemMuoiCostPerG(
    kemBeo: { averageCost: number; contentQuantity?: number },
    suaDac: { averageCost: number; contentQuantity?: number },
    suaTuoi: { averageCost: number; contentQuantity?: number }
): number {
    const kemPerMl = kemBeo.averageCost / (kemBeo.contentQuantity || 450);
    const dacPerMl = suaDac.averageCost / (suaDac.contentQuantity || 1000);
    const tuoiPerMl = suaTuoi.averageCost / (suaTuoi.contentQuantity || 1000);
    const batchCost = 60 * kemPerMl + 5 * dacPerMl + 10 * tuoiPerMl;
    const batchGrams = 75;
    return Math.round((batchCost / batchGrams) * 100) / 100;
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
    const kemBeo = await findStorage(storeId, "KEMBEO");
    const suaDac = await findStorage(storeId, "SUADAC");
    const suaTuoi = await findStorage(storeId, "SUATUOI");
    const nao = await findStorage(storeId, "NAO");
    const lyNho = await findStorage(storeId, "LYNHO");
    const lyLon = await findStorage(storeId, "LYLON");
    const ongNho = await findStorage(storeId, "ONGHUTNHO");
    const ongLon = await findStorage(storeId, "ONGHUTLON");

    if (
        !traLai ||
        !traDen ||
        !nuocDuong ||
        !kemBeo ||
        !suaDac ||
        !suaTuoi ||
        !nao ||
        !lyNho ||
        !lyLon ||
        !ongNho ||
        !ongLon
    ) {
        throw new Error("Missing required storage items on MAIN store");
    }

    console.log("Ensuring semi-finished storage items...");
    const traPha = await ensureStorageItem(storeId, {
        code: "TRAPHA",
        name: "Trà pha (lài + đen)",
        unit: "ml",
        averageCost: computeTraPhaCostPerMl(traLai, traDen),
    });

    const kemMuoi = await ensureStorageItem(storeId, {
        code: "KEMMUOI",
        name: "Kem muối (pha sẵn)",
        unit: "g",
        averageCost: computeKemMuoiCostPerG(kemBeo, suaDac, suaTuoi),
    });

    const dish =
        (await Dish.findOne({
            store: storeId,
            name: new RegExp(`^${escapeRegex(DISH_NAME)}$`, "i"),
        })) ??
        (await Dish.findOne({
            store: storeId,
            name: /Trà.*Machiato/i,
        }));

    if (!dish) {
        throw new Error(`Dish not found: ${DISH_NAME}`);
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
                    storageItemId: nuocDuong!._id,
                    quantity: spec.nuocDuong,
                    unit: "ml",
                    notes: "",
                },
                {
                    storageItemId: traPha._id,
                    quantity: spec.traPha,
                    unit: "ml",
                    notes: "",
                },
                {
                    storageItemId: kemMuoi._id,
                    quantity: spec.kemMuoi,
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
        notes: "Không bỏ tắc",
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
        const lines = variant.ingredients.map((line) => {
            const labels: Record<string, string> = {
                [String(nuocDuong!._id)]: "đường",
                [String(traPha._id)]: "trà",
                [String(kemMuoi._id)]: "kem muối",
            };
            const label = labels[String(line.storageItemId)] ?? "item";
            return `${label} ${line.quantity}${line.unit}`;
        });
        console.log(
            `  ${variant.size}: ${total.toLocaleString("vi-VN")}₫ (${lines.join(", ")})`
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
