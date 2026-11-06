import type {
    DishLike,
    DishSizeVariantLike,
    DishStoreLike,
    ResolvedDishPricing,
    ResolvedSizeVariant,
    ResolvedUnitPrice,
} from "../types/dishStore.js";

function storeIdOf(dish: DishLike): string | null {
    const store: unknown = dish.store;
    if (!store) return null;
    if (typeof store === "string") return store;
    if (typeof store === "object" && store !== null && "_id" in store) {
        return String((store as { _id: unknown })._id);
    }
    return String(store);
}

function overlayHasNumber(value: number | null | undefined): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function overlaySizeMap(overlay: DishStoreLike | null | undefined): Map<string, { price: number; cost: number }> {
    const map = new Map<string, { price: number; cost: number }>();
    for (const variant of overlay?.sizeVariants || []) {
        if (!variant?.size) continue;
        map.set(variant.size.toLowerCase(), {
            price: variant.price,
            cost: overlayHasNumber(variant.cost) ? variant.cost : 0,
        });
    }
    return map;
}

export function dishBelongsToStore(dish: DishLike, storeId: string): boolean {
    const ownerId = storeIdOf(dish);
    if (!ownerId) return true;
    return ownerId === storeId;
}

export function isDishVisibleAtStore(
    dish: DishLike,
    overlay: DishStoreLike | null | undefined,
    storeId: string
): boolean {
    if (!dishBelongsToStore(dish, storeId)) return false;
    if (dish.isAvailable === false) return false;
    if (overlay && overlay.isAvailable === false) return false;
    return true;
}

function catalogVariants(dish: DishLike): DishSizeVariantLike[] {
    if (!dish.hasSizeVariants) return [];
    return dish.sizeVariants || [];
}

function pickCatalogVariant(
    variants: DishSizeVariantLike[],
    requestedSize?: string
): DishSizeVariantLike | undefined {
    if (variants.length === 0) return undefined;
    const requested = requestedSize?.trim().toLowerCase();
    if (requested) {
        const match = variants.find((variant) => variant.size.toLowerCase() === requested);
        if (match) return match;
    }
    return variants.find((variant) => variant.isDefault) || variants[0];
}

function resolveVariantPrice(
    catalog: DishSizeVariantLike,
    overlay: DishStoreLike | null | undefined
): { price: number; cost: number } {
    const overlayMatch = overlaySizeMap(overlay).get(catalog.size.toLowerCase());
    if (overlayMatch) {
        return overlayMatch;
    }
    return {
        price: catalog.price,
        cost: overlayHasNumber(catalog.cost) ? catalog.cost : 0,
    };
}

export function resolveDishUnitPrice(
    dish: DishLike,
    overlay: DishStoreLike | null | undefined,
    requestedSize?: string
): ResolvedUnitPrice {
    const variants = catalogVariants(dish);
    const catalog = pickCatalogVariant(variants, requestedSize);
    if (catalog) {
        const resolved = resolveVariantPrice(catalog, overlay);
        return {
            price: resolved.price,
            cost: resolved.cost,
            variant: {
                size: catalog.size,
                price: resolved.price,
                cost: resolved.cost,
            },
        };
    }

    const price = overlayHasNumber(overlay?.price) ? overlay.price : dish.price;
    const cost = overlayHasNumber(overlay?.cost)
        ? overlay.cost
        : overlayHasNumber(dish.cost)
          ? dish.cost
          : 0;
    return { price, cost };
}

export function resolveDishForStore(
    dish: DishLike,
    overlay: DishStoreLike | null | undefined
): ResolvedDishPricing {
    const variants = catalogVariants(dish);
    const sizeVariants: ResolvedSizeVariant[] = variants.map((variant) => {
        const resolved = resolveVariantPrice(variant, overlay);
        return {
            _id: variant._id,
            size: variant.size,
            price: resolved.price,
            cost: resolved.cost,
            isDefault: Boolean(variant.isDefault),
        };
    });

    return {
        price: overlayHasNumber(overlay?.price) ? overlay.price : dish.price,
        cost: overlayHasNumber(overlay?.cost)
            ? overlay.cost
            : overlayHasNumber(dish.cost)
              ? dish.cost
              : 0,
        isAvailable: dish.isAvailable !== false && overlay?.isAvailable !== false,
        hasSizeVariants: sizeVariants.length > 0,
        sizeVariants,
    };
}

export function applyDishStoreOverlay<T extends DishLike>(
    dish: T,
    overlay: DishStoreLike | null | undefined
): T & ResolvedDishPricing {
    const resolved = resolveDishForStore(dish, overlay);
    return {
        ...dish,
        price: resolved.price,
        cost: resolved.cost,
        isAvailable: resolved.isAvailable,
        hasSizeVariants: resolved.hasSizeVariants,
        sizeVariants: resolved.sizeVariants,
    };
}

export function overlayByDishId(
    overlays: Array<DishStoreLike & { dish?: { toString(): string } | string }>
): Map<string, DishStoreLike> {
    const map = new Map<string, DishStoreLike>();
    for (const overlay of overlays) {
        if (!overlay.dish) continue;
        const id = typeof overlay.dish === "string" ? overlay.dish : overlay.dish.toString();
        map.set(id, overlay);
    }
    return map;
}
