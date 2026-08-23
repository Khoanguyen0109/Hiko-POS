export interface VarianceStoreInfo {
  _id: string;
  name: string;
  code: string;
}

export interface VarianceStoreSummary {
  store: { id: string; name: string; code: string };
  summary: {
    theoreticalCost: number;
    actualCost: number;
    varianceCost: number;
    coverageMissingPortions: number;
    completedOrderCount: number;
  };
}

export interface VarianceItemRow {
  storageItemId: string;
  storeId: string;
  storeName: string;
  name: string;
  code: string;
  unit: string;
  averageCost: number;
  theoreticalQty: number;
  actualQty: number;
  varianceQty: number;
  variancePct: number | null;
  theoreticalCost: number;
  actualCost: number;
  varianceCost: number;
}

export interface VarianceMissingRecipe {
  type: "dish" | "topping";
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  portions: number;
}

export interface VarianceUnitMismatch {
  storageItemId: string;
  name: string;
  storeId: string;
  storeName: string;
  fromUnit: string;
  toUnit: string;
  portions: number;
}

export interface MaterialVarianceSummary {
  completedOrderCount: number;
  theoreticalCost: number;
  actualCost: number;
  varianceCost: number;
  itemsOver: number;
  itemsUnder: number;
  coverageMissingPortions: number;
  coverageUnitMismatchCount: number;
}

export interface MaterialVarianceData {
  scope: "all" | "single";
  stores: VarianceStoreInfo[];
  summary: MaterialVarianceSummary;
  storeSummaries: VarianceStoreSummary[];
  items: VarianceItemRow[];
  coverage: {
    missingRecipes: VarianceMissingRecipe[];
    unitMismatches: VarianceUnitMismatch[];
  };
}

export interface VarianceRecipeLine {
  storageItemId: string;
  quantity: number;
  unit: string;
}

export interface VarianceDishRecipe {
  storeId: string;
  dishId: string;
  ingredients: VarianceRecipeLine[];
  sizeVariantRecipes: { size: string; ingredients: VarianceRecipeLine[] }[];
  totalIngredientCost: number;
  otherCost?: number;
}

export interface VarianceToppingRecipe {
  storeId: string;
  toppingId: string;
  ingredients: VarianceRecipeLine[];
}

export interface VarianceOrderTopping {
  toppingId: string;
  name: string;
  quantity: number;
}

export interface VarianceOrderLine {
  dishId: string;
  name: string;
  quantity: number;
  size?: string | null;
  toppings: VarianceOrderTopping[];
}

export interface VarianceOrder {
  storeId: string;
  orderStatus: string;
  completedAt: Date | null;
  items: VarianceOrderLine[];
}

export interface VarianceExport {
  storeId: string;
  storageItemId: string;
  quantity: number;
  status: string;
  reason: string;
}

export interface VarianceStorageItem {
  id: string;
  storeId: string;
  name: string;
  code: string;
  unit: string;
  averageCost: number;
  isActive: boolean;
  contentQuantity?: number;
  contentUnit?: string;
}

export interface MaterialVarianceInput {
  scope: "all" | "single";
  stores: VarianceStoreInfo[];
  orders: VarianceOrder[];
  dishRecipes: VarianceDishRecipe[];
  toppingRecipes: VarianceToppingRecipe[];
  exports: VarianceExport[];
  storageItems: VarianceStorageItem[];
}
