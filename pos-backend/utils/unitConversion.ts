const UNIT_ALIASES: Record<string, string> = {
    kilogram: "kg",
    kilograms: "kg",
    gram: "g",
    grams: "g",
    litre: "liter",
    litres: "liter",
    liters: "liter",
    l: "liter",
    milliliter: "ml",
    milliliters: "ml",
    pieces: "piece",
    pcs: "piece",
    packs: "pack",
    boxes: "box",
    bags: "bag",
};

const BASE_UNIT: Record<string, string> = {
    kg: "g",
    g: "g",
    liter: "ml",
    ml: "ml",
    piece: "piece",
    pack: "pack",
    box: "box",
    bag: "bag",
};

const TO_BASE_FACTOR: Record<string, number> = {
    kg: 1000,
    g: 1,
    liter: 1000,
    ml: 1,
    piece: 1,
    pack: 1,
    box: 1,
    bag: 1,
};

export const PACKAGING_UNITS = ["box", "pack", "bag"] as const;
export const RECIPE_UNITS = ["kg", "g", "liter", "ml", "piece"] as const;

export interface StorageItemCostInput {
    unit: string;
    averageCost: number;
    contentQuantity?: number;
    contentUnit?: string;
}

export function normalizeUnit(unit: string): string {
    const trimmed = unit.trim().toLowerCase();
    return UNIT_ALIASES[trimmed] ?? trimmed;
}

export function hasPackageContent(item: StorageItemCostInput): boolean {
    return Boolean(
        item.contentQuantity &&
        item.contentQuantity > 0 &&
        item.contentUnit &&
        item.contentUnit.trim().length > 0
    );
}

export function getDefaultRecipeUnit(item: StorageItemCostInput): string {
    if (hasPackageContent(item)) {
        return normalizeUnit(item.contentUnit!);
    }
    return normalizeUnit(item.unit);
}

export function convertQuantity(
    quantity: number,
    fromUnit: string,
    toUnit: string
): number | null {
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);

    if (from === to) {
        return quantity;
    }

    const fromBase = BASE_UNIT[from];
    const toBase = BASE_UNIT[to];

    if (!fromBase || !toBase || fromBase !== toBase) {
        return null;
    }

    const baseQuantity = quantity * TO_BASE_FACTOR[from];
    return baseQuantity / TO_BASE_FACTOR[to];
}

export function getCostPerRecipeUnit(item: StorageItemCostInput, recipeUnit: string): number {
    const normalizedRecipeUnit = normalizeUnit(recipeUnit);

    if (normalizedRecipeUnit === normalizeUnit(item.unit)) {
        return item.averageCost;
    }

    if (hasPackageContent(item)) {
        const contentUnit = normalizeUnit(item.contentUnit!);
        const quantityInContentUnit = convertQuantity(
            1,
            normalizedRecipeUnit,
            contentUnit
        );

        if (quantityInContentUnit !== null) {
            return (item.averageCost / item.contentQuantity!) * quantityInContentUnit;
        }
    }

    const convertedQuantity = convertQuantity(1, normalizedRecipeUnit, item.unit);
    if (convertedQuantity !== null) {
        return item.averageCost * convertedQuantity;
    }

    return 0;
}

export function calculateLineCost(
    quantity: number,
    lineUnit: string,
    item: StorageItemCostInput
): number {
    if (quantity <= 0) {
        return 0;
    }

    const costPerUnit = getCostPerRecipeUnit(item, lineUnit);
    return quantity * costPerUnit;
}

export function formatPackageLabel(item: StorageItemCostInput): string | null {
    if (!hasPackageContent(item)) {
        return null;
    }

    return `1 ${item.unit} = ${item.contentQuantity} ${item.contentUnit}`;
}
