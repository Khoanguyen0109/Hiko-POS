import { getRecipeForSize } from "./recipeService.js";
import { convertRecipeQtyToStockQty } from "../utils/unitConversion.js";
import type {
    MaterialVarianceData,
    MaterialVarianceInput,
    VarianceDishRecipe,
    VarianceItemRow,
    VarianceMissingRecipe,
    VarianceStorageItem,
    VarianceUnitMismatch,
} from "../types/variance.js";

function rowKey(storeId: string, storageItemId: string): string {
    return `${storeId}:${storageItemId}`;
}

function recipeKey(storeId: string, id: string): string {
    return `${storeId}:${id}`;
}

export function buildMaterialVariance(input: MaterialVarianceInput): MaterialVarianceData {
    const storeNameById = new Map(input.stores.map((store) => [store._id, store.name]));
    const itemById = new Map(input.storageItems.map((item) => [item.id, item]));
    const dishByKey = new Map(
        input.dishRecipes.map((recipe) => [recipeKey(recipe.storeId, recipe.dishId), recipe])
    );
    const toppingByKey = new Map(
        input.toppingRecipes.map((recipe) => [recipeKey(recipe.storeId, recipe.toppingId), recipe])
    );

    const theoretical = new Map<string, number>();
    const actual = new Map<string, number>();
    const missingMap = new Map<string, VarianceMissingRecipe>();
    const mismatchMap = new Map<string, VarianceUnitMismatch>();

    const addQty = (map: Map<string, number>, storeId: string, storageItemId: string, qty: number) => {
        const key = rowKey(storeId, storageItemId);
        map.set(key, (map.get(key) ?? 0) + qty);
    };

    const addMissing = (row: VarianceMissingRecipe) => {
        const key = `${row.type}:${row.storeId}:${row.id}`;
        const existing = missingMap.get(key);
        if (existing) {
            existing.portions += row.portions;
            return;
        }
        missingMap.set(key, { ...row });
    };

    const addMismatch = (row: VarianceUnitMismatch) => {
        const key = `${row.storeId}:${row.storageItemId}:${row.fromUnit}:${row.toUnit}`;
        const existing = mismatchMap.get(key);
        if (existing) {
            existing.portions += row.portions;
            return;
        }
        mismatchMap.set(key, { ...row });
    };

    const applyLines = (
        storeId: string,
        lines: VarianceDishRecipe["ingredients"],
        multiplier: number
    ) => {
        for (const line of lines) {
            const item = itemById.get(line.storageItemId);
            const portions = multiplier;
            if (!item || !item.isActive || item.storeId !== storeId) {
                addMismatch({
                    storageItemId: line.storageItemId,
                    name: item?.name ?? line.storageItemId,
                    storeId,
                    storeName: storeNameById.get(storeId) ?? "",
                    fromUnit: line.unit,
                    toUnit: "",
                    portions,
                });
                continue;
            }

            const converted = convertRecipeQtyToStockQty(
                line.quantity * multiplier,
                line.unit,
                item
            );
            if (converted === null) {
                addMismatch({
                    storageItemId: item.id,
                    name: item.name,
                    storeId,
                    storeName: storeNameById.get(storeId) ?? "",
                    fromUnit: line.unit,
                    toUnit: item.unit,
                    portions,
                });
                continue;
            }

            addQty(theoretical, storeId, item.id, converted);
        }
    };

    let completedOrderCount = 0;

    for (const order of input.orders) {
        if (order.orderStatus !== "completed" || !order.completedAt) {
            continue;
        }
        completedOrderCount += 1;

        for (const line of order.items) {
            const dishRecipe = dishByKey.get(recipeKey(order.storeId, line.dishId));
            if (!dishRecipe) {
                addMissing({
                    type: "dish",
                    id: line.dishId,
                    name: line.name,
                    storeId: order.storeId,
                    storeName: storeNameById.get(order.storeId) ?? "",
                    portions: line.quantity,
                });
            } else {
                const sized = getRecipeForSize(
                    {
                        ingredients: dishRecipe.ingredients,
                        sizeVariantRecipes: dishRecipe.sizeVariantRecipes.map((variant) => ({
                            ...variant,
                            totalIngredientCost: 0,
                        })),
                        totalIngredientCost: dishRecipe.totalIngredientCost,
                        otherCost: dishRecipe.otherCost,
                    },
                    line.size
                );
                applyLines(order.storeId, sized.ingredients, line.quantity);
            }

            for (const topping of line.toppings) {
                const toppingRecipe = toppingByKey.get(
                    recipeKey(order.storeId, topping.toppingId)
                );
                if (!toppingRecipe) {
                    addMissing({
                        type: "topping",
                        id: topping.toppingId,
                        name: topping.name,
                        storeId: order.storeId,
                        storeName: storeNameById.get(order.storeId) ?? "",
                        portions: line.quantity * topping.quantity,
                    });
                    continue;
                }
                applyLines(
                    order.storeId,
                    toppingRecipe.ingredients,
                    line.quantity * topping.quantity
                );
            }
        }
    }

    for (const exp of input.exports) {
        if (exp.status !== "completed" || exp.reason !== "production") {
            continue;
        }
        addQty(actual, exp.storeId, exp.storageItemId, exp.quantity);
    }

    const keys = new Set([...theoretical.keys(), ...actual.keys()]);
    const items: VarianceItemRow[] = [];

    for (const key of keys) {
        const [storeId, storageItemId] = key.split(":");
        const item = itemById.get(storageItemId);
        const theoreticalQty = theoretical.get(key) ?? 0;
        const actualQty = actual.get(key) ?? 0;
        if (theoreticalQty === 0 && actualQty === 0) {
            continue;
        }

        const fallback: VarianceStorageItem = item ?? {
            id: storageItemId,
            storeId,
            name: storageItemId,
            code: "",
            unit: "",
            averageCost: 0,
            isActive: false,
        };
        const averageCost = fallback.averageCost;
        const varianceQty = actualQty - theoreticalQty;

        items.push({
            storageItemId,
            storeId,
            storeName: storeNameById.get(storeId) ?? "",
            name: fallback.name,
            code: fallback.code,
            unit: fallback.unit,
            averageCost,
            theoreticalQty,
            actualQty,
            varianceQty,
            variancePct: theoreticalQty === 0 ? null : varianceQty / theoreticalQty,
            theoreticalCost: theoreticalQty * averageCost,
            actualCost: actualQty * averageCost,
            varianceCost: varianceQty * averageCost,
        });
    }

    items.sort((a, b) => Math.abs(b.varianceCost) - Math.abs(a.varianceCost));

    const theoreticalCost = items.reduce((sum, row) => sum + row.theoreticalCost, 0);
    const actualCost = items.reduce((sum, row) => sum + row.actualCost, 0);
    const missingRecipes = [...missingMap.values()];
    const unitMismatches = [...mismatchMap.values()];
    const coverageMissingPortions = missingRecipes.reduce((sum, row) => sum + row.portions, 0);

    const storeSummaries =
        input.scope === "all"
            ? input.stores.map((store) => {
                  const storeItems = items.filter((row) => row.storeId === store._id);
                  const storeMissing = missingRecipes
                      .filter((row) => row.storeId === store._id)
                      .reduce((sum, row) => sum + row.portions, 0);
                  const storeTheoretical = storeItems.reduce((sum, row) => sum + row.theoreticalCost, 0);
                  const storeActual = storeItems.reduce((sum, row) => sum + row.actualCost, 0);
                  return {
                      store: { id: store._id, name: store.name, code: store.code },
                      summary: {
                          theoreticalCost: storeTheoretical,
                          actualCost: storeActual,
                          varianceCost: storeActual - storeTheoretical,
                          coverageMissingPortions: storeMissing,
                      },
                  };
              })
            : [];

    return {
        scope: input.scope,
        stores: input.stores,
        summary: {
            completedOrderCount,
            theoreticalCost,
            actualCost,
            varianceCost: actualCost - theoreticalCost,
            itemsOver: items.filter((row) => row.varianceQty > 0).length,
            itemsUnder: items.filter((row) => row.varianceQty < 0).length,
            coverageMissingPortions,
            coverageUnitMismatchCount: unitMismatches.length,
        },
        storeSummaries,
        items,
        coverage: { missingRecipes, unitMismatches },
    };
}
