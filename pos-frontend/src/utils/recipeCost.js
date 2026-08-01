const UNIT_ALIASES = {
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

const BASE_UNIT = {
  kg: "g",
  g: "g",
  liter: "ml",
  ml: "ml",
  piece: "piece",
  pack: "pack",
  box: "box",
  bag: "bag",
};

const TO_BASE_FACTOR = {
  kg: 1000,
  g: 1,
  liter: 1000,
  ml: 1,
  piece: 1,
  pack: 1,
  box: 1,
  bag: 1,
};

export const PACKAGING_UNITS = ["box", "pack", "bag"];
export const RECIPE_UNIT_OPTIONS = ["ml", "liter", "g", "kg", "piece"];

export function normalizeUnit(unit = "") {
  const trimmed = unit.trim().toLowerCase();
  return UNIT_ALIASES[trimmed] ?? trimmed;
}

export function hasPackageContent(item) {
  return Boolean(
    item?.contentQuantity > 0 &&
    item?.contentUnit &&
    item.contentUnit.trim().length > 0
  );
}

export function getDefaultRecipeUnit(item) {
  if (hasPackageContent(item)) {
    return normalizeUnit(item.contentUnit);
  }
  return normalizeUnit(item?.unit || "");
}

export function getRecipeUnitOptions(item) {
  const options = [];

  if (hasPackageContent(item)) {
    options.push(normalizeUnit(item.contentUnit));
  }

  if (item?.unit && !options.includes(item.unit)) {
    options.push(item.unit);
  }

  return options.length > 0 ? options : RECIPE_UNIT_OPTIONS;
}

export function convertQuantity(quantity, fromUnit, toUnit) {
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

export function getCostPerRecipeUnit(item, recipeUnit) {
  if (!item) {
    return 0;
  }

  const normalizedRecipeUnit = normalizeUnit(recipeUnit);

  if (normalizedRecipeUnit === normalizeUnit(item.unit)) {
    return item.averageCost || 0;
  }

  if (hasPackageContent(item)) {
    const contentUnit = normalizeUnit(item.contentUnit);
    const quantityInContentUnit = convertQuantity(1, normalizedRecipeUnit, contentUnit);

    if (quantityInContentUnit !== null) {
      return ((item.averageCost || 0) / item.contentQuantity) * quantityInContentUnit;
    }
  }

  const convertedQuantity = convertQuantity(1, normalizedRecipeUnit, item.unit);
  if (convertedQuantity !== null) {
    return (item.averageCost || 0) * convertedQuantity;
  }

  return 0;
}

export function calculateRecipeLineCost(quantity, unit, item) {
  if (!quantity || quantity <= 0 || !item) {
    return 0;
  }

  return quantity * getCostPerRecipeUnit(item, unit);
}

export function formatPackageLabel(item) {
  if (!hasPackageContent(item)) {
    return null;
  }

  return `1 ${item.unit} = ${item.contentQuantity} ${item.contentUnit}`;
}

export function formatStorageItemOptionLabel(item, formatVND) {
  const costLabel = formatVND(item.averageCost || 0);
  const packageLabel = formatPackageLabel(item);

  if (packageLabel) {
    const perUnitCost = getCostPerRecipeUnit(item, item.contentUnit);
    return `${item.name} (${item.code}) - ${costLabel}/${item.unit} · ${packageLabel} · ${formatVND(perUnitCost)}/${item.contentUnit}`;
  }

  return `${item.name} (${item.code}) - ${costLabel}/${item.unit}`;
}
