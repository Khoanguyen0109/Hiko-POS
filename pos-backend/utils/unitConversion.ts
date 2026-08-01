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

export function normalizeUnit(unit: string): string {
    const trimmed = unit.trim().toLowerCase();
    return UNIT_ALIASES[trimmed] ?? trimmed;
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

export function calculateLineCost(
    quantity: number,
    lineUnit: string,
    itemUnit: string,
    averageCost: number
): number {
    const convertedQuantity = convertQuantity(quantity, lineUnit, itemUnit);

    if (convertedQuantity === null) {
        return 0;
    }

    return convertedQuantity * averageCost;
}
