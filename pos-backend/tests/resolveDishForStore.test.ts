import { describe, expect, it } from "@jest/globals";
import {
    applyDishStoreOverlay,
    dishBelongsToStore,
    isDishVisibleAtStore,
    resolveDishForStore,
    resolveDishUnitPrice,
} from "../utils/resolveDishForStore.js";
import type { DishLike, DishStoreLike } from "../types/dishStore.js";

const catalog: DishLike = {
    store: null,
    price: 49000,
    cost: 10000,
    isAvailable: true,
    hasSizeVariants: true,
    sizeVariants: [
        { size: "Medium", price: 49000, cost: 10000, isDefault: true },
        { size: "Large", price: 59000, cost: 12000 },
    ],
};

describe("resolveDishForStore", () => {
    it("uses catalog prices when no overlay exists", () => {
        const resolved = resolveDishForStore(catalog, null);
        expect(resolved.price).toBe(49000);
        expect(resolved.sizeVariants.map((v) => v.price)).toEqual([49000, 59000]);
        expect(resolved.isAvailable).toBe(true);
        expect(resolveDishUnitPrice(catalog, null, "Large").price).toBe(59000);
    });

    it("uses store size price first, then catalog size", () => {
        const overlay: DishStoreLike = {
            isAvailable: true,
            sizeVariants: [{ size: "Large", price: 65000, cost: 15000 }],
        };
        expect(resolveDishUnitPrice(catalog, overlay, "Large").price).toBe(65000);
        expect(resolveDishUnitPrice(catalog, overlay, "Medium").price).toBe(49000);
        const resolved = resolveDishForStore(catalog, overlay);
        expect(resolved.sizeVariants.find((v) => v.size === "Large")?.price).toBe(65000);
        expect(resolved.sizeVariants.find((v) => v.size === "Medium")?.price).toBe(49000);
    });

    it("uses overlay base price when the dish has no size variants", () => {
        const plain: DishLike = { store: null, price: 40000, cost: 8000, isAvailable: true };
        const overlay: DishStoreLike = { isAvailable: true, price: 45000, cost: 9000 };
        expect(resolveDishUnitPrice(plain, overlay).price).toBe(45000);
        expect(resolveDishForStore(plain, overlay).cost).toBe(9000);
    });

    it("hides a dish when the store overlay disables it", () => {
        const overlay: DishStoreLike = { isAvailable: false };
        expect(isDishVisibleAtStore(catalog, overlay, "store-a")).toBe(false);
        expect(applyDishStoreOverlay(catalog, overlay).isAvailable).toBe(false);
    });

    it("keeps a globally disabled dish hidden even if the overlay is enabled", () => {
        const hidden: DishLike = { ...catalog, isAvailable: false };
        expect(isDishVisibleAtStore(hidden, { isAvailable: true }, "store-a")).toBe(false);
    });

    it("rejects a dish owned by another store", () => {
        const owned: DishLike = { ...catalog, store: "store-b" };
        expect(dishBelongsToStore(owned, "store-a")).toBe(false);
        expect(isDishVisibleAtStore(owned, null, "store-a")).toBe(false);
        expect(dishBelongsToStore(owned, "store-b")).toBe(true);
    });
});
