import type { MongoFilter } from "../types/mongo.js";
import type { DishLike, DishStoreLike, DishStoreSizeVariantLike } from "../types/dishStore.js";

import createHttpError from "http-errors";
import mongoose from "mongoose";
import Dish from "../models/dishModel.js";
import DishStore, { SIZE_OPTIONS } from "../models/dishStoreModel.js";
import Category from "../models/categoryModel.js";
import * as cache from "../services/cacheService.js";
import {
    applyDishStoreOverlay,
    dishBelongsToStore,
    overlayByDishId,
} from "../utils/resolveDishForStore.js";

const CACHE_ALL       = "dishes:all";
const CACHE_AVAILABLE = "dishes:available";
const CACHE_TTL       = 120; // seconds

const dishCacheKey = (base: string, storeId?: string) =>
    storeId ? `${base}:${storeId}` : base;

const invalidateDishCache = () => cache.delByPattern("dishes:*");

const storeIdFromRequest = (req: { store?: { _id?: { toString(): string } } }): string | undefined =>
    req.store?._id?.toString();

const dishStoreFilter = (storeId?: string): MongoFilter =>
    storeId ? { $or: [{ store: storeId }, { store: null }] } : {};

async function withStoreOverlay<T extends DishLike & { _id: { toString(): string } }>(
    dishes: T[],
    storeId?: string
): Promise<Array<T & { storeOverlay: DishStoreLike | null }>> {
    if (!storeId) {
        return dishes.map((dish) => ({ ...dish, storeOverlay: null }));
    }
    const overlays = await DishStore.find({
        store: storeId,
        dish: { $in: dishes.map((dish) => dish._id) },
    }).lean();
    const overlayMap = overlayByDishId(overlays);
    return dishes.map((dish) => {
        const overlay = overlayMap.get(dish._id.toString()) ?? null;
        return {
            ...applyDishStoreOverlay(dish, overlay),
            storeOverlay: overlay,
        };
    });
}

const addDish = async (req, res, next) => {
    try {
        const { 
            name, 
            price, 
            category, 
            cost, 
            note, 
            image, 
            hasSizeVariants, 
            sizeVariants, 
            isAvailable
        } = req.body;

        // Basic validation
        if (!name || price === undefined || !category) {
            const error = createHttpError(400, "Please provide name, price and category!");
            return next(error);
        }

        if (typeof price !== 'number' || price < 0) {
            const error = createHttpError(400, "Price must be a non-negative number!");
            return next(error);
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            const error = createHttpError(400, "Invalid category id!");
            return next(error);
        }

        const categoryExists = await Category.exists({ _id: category });
        if (!categoryExists) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        // Validate size variants if enabled
        if (hasSizeVariants) {
            if (!sizeVariants || !Array.isArray(sizeVariants) || sizeVariants.length === 0) {
                const error = createHttpError(400, "Size variants are required when hasSizeVariants is true!");
                return next(error);
            }

            // Validate each size variant
            for (const variant of sizeVariants) {
                if (!variant.size || typeof variant.price !== 'number' || variant.price < 0) {
                    const error = createHttpError(400, "Each size variant must have a valid size and price!");
                    return next(error);
                }
                
            }

            // Validate that sizes are unique
            const sizes = sizeVariants.map(v => v.size);
            const uniqueSizes = [...new Set(sizes)];
            if (sizes.length !== uniqueSizes.length) {
                const error = createHttpError(400, "Size variant sizes must be unique!");
                return next(error);
            }

            // Ensure at least one default variant
            const defaultVariants = sizeVariants.filter(v => v.isDefault);
            if (defaultVariants.length === 0) {
                sizeVariants[0].isDefault = true;
            } else if (defaultVariants.length > 1) {
                // Keep only the first default
                sizeVariants.forEach((variant, index) => {
                    variant.isDefault = index === sizeVariants.findIndex(v => v.isDefault);
                });
            }
        }

        // Validate image URL if provided
        if (image && typeof image !== 'string') {
            const error = createHttpError(400, "Image must be a valid URL string!");
            return next(error);
        }

        const newDish = new Dish({
            name: name.trim(),
            price,
            category,
            cost: cost || 0,
            note: note ? String(note).trim() : "",
            image: image ? String(image).trim() : "",
            hasSizeVariants: Boolean(hasSizeVariants),
            sizeVariants: hasSizeVariants ? sizeVariants.map(variant => ({
                ...variant
            })) : [],
            isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true
        });

        await newDish.save();
        await invalidateDishCache();
        const populated = await newDish.populate({ path: 'category', select: 'name' });
        res.status(201).json({ success: true, message: "Dish created successfully!", data: populated });
    } catch (error) {
        next(error);
    }
}

const getDishes = async (req, res, next) => {
    try {
        const storeId = storeIdFromRequest(req);
        const dishes = await cache.getOrSet(
            dishCacheKey(CACHE_ALL, storeId),
            async () => {
                const rows = await Dish.find(dishStoreFilter(storeId))
                    .populate({ path: "category", select: "name" })
                    .sort({ createdAt: -1 })
                    .lean();
                return withStoreOverlay(rows, storeId);
            },
            CACHE_TTL
        );
        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        next(error);
    }
}

const getDishById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const dish = await Dish.findById(id).populate({ path: "category", select: "name" }).lean();
        if (!dish) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        const storeId = storeIdFromRequest(req);
        if (storeId && !dishBelongsToStore(dish, storeId)) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        res.status(200).json({ success: true, data: dish });
    } catch (error) {
        next(error);
    }
}

const updateDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const updates: MongoFilter = {};
        const { 
            name, 
            price, 
            category, 
            cost, 
            note, 
            image, 
            hasSizeVariants, 
            sizeVariants, 
            isAvailable
        } = req.body;

        // Update basic fields
        if (name !== undefined) updates.name = String(name).trim();
        
        if (price !== undefined) {
            if (typeof price !== 'number' || price < 0) {
                const error = createHttpError(400, "Price must be a non-negative number!");
                return next(error);
            }
            updates.price = price;
        }
        
        if (category !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                const error = createHttpError(400, "Invalid category id!");
                return next(error);
            }
            const categoryExists = await Category.exists({ _id: category });
            if (!categoryExists) {
                const error = createHttpError(404, "Category not found!");
                return next(error);
            }
            updates.category = category;
        }
        
        if (cost !== undefined) {
            if (typeof cost !== 'number' || cost < 0) {
                const error = createHttpError(400, "Cost must be a non-negative number!");
                return next(error);
            }
            updates.cost = cost;
        }
        
        if (note !== undefined) updates.note = String(note).trim();
        
        if (image !== undefined) {
            if (image && typeof image !== 'string') {
                const error = createHttpError(400, "Image must be a valid URL string!");
                return next(error);
            }
            updates.image = image ? String(image).trim() : "";
        }
        
        if (isAvailable !== undefined) updates.isAvailable = Boolean(isAvailable);

        // Handle size variants
        if (hasSizeVariants !== undefined) {
            updates.hasSizeVariants = Boolean(hasSizeVariants);
            
            if (hasSizeVariants) {
                if (!sizeVariants || !Array.isArray(sizeVariants) || sizeVariants.length === 0) {
                    const error = createHttpError(400, "Size variants are required when hasSizeVariants is true!");
                    return next(error);
                }

                // Validate each size variant
                for (const variant of sizeVariants) {
                    if (!variant.size || typeof variant.price !== 'number' || variant.price < 0) {
                        const error = createHttpError(400, "Each size variant must have a valid size and price!");
                        return next(error);
                    }
                    
                }

                // Validate that sizes are unique
                const sizes = sizeVariants.map(v => v.size);
                const uniqueSizes = [...new Set(sizes)];
                if (sizes.length !== uniqueSizes.length) {
                    const error = createHttpError(400, "Size variant sizes must be unique!");
                    return next(error);
                }

                // Ensure at least one default variant
                const defaultVariants = sizeVariants.filter(v => v.isDefault);
                if (defaultVariants.length === 0) {
                    sizeVariants[0].isDefault = true;
                } else if (defaultVariants.length > 1) {
                    // Keep only the first default
                    sizeVariants.forEach((variant, index) => {
                        variant.isDefault = index === sizeVariants.findIndex(v => v.isDefault);
                    });
                }

                updates.sizeVariants = sizeVariants.map(variant => ({
                    ...variant
                }));
            } else {
                updates.sizeVariants = [];
            }
        }

        const updated = await Dish.findByIdAndUpdate(id, updates, { new: true })
            .populate({ path: 'category', select: 'name' });
        
        if (!updated) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        await invalidateDishCache();
        res.status(200).json({ success: true, message: "Dish updated successfully!", data: updated });
    } catch (error) {
        next(error);
    }
}

const deleteDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const deleted = await Dish.findByIdAndDelete(id);
        if (!deleted) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        await DishStore.deleteMany({ dish: id });
        await invalidateDishCache();
        res.status(200).json({ success: true, message: "Dish deleted successfully!" });
    } catch (error) {
        next(error);
    }
}

const getDishesByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const error = createHttpError(404, "Invalid category id!");
            return next(error);
        }

        const categoryExists = await Category.exists({ _id: categoryId });
        if (!categoryExists) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        const storeId = storeIdFromRequest(req);
        const dishes = await Dish.find({ category: categoryId, ...dishStoreFilter(storeId) })
            .populate({ path: "category", select: "name" })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, data: await withStoreOverlay(dishes, storeId) });
    } catch (error) {
        next(error);
    }
}

const getAvailableDishes = async (req, res, next) => {
    try {
        const storeId = storeIdFromRequest(req);
        const dishes = await cache.getOrSet(
            dishCacheKey(CACHE_AVAILABLE, storeId),
            async () => {
                const rows = await Dish.find({ isAvailable: true, ...dishStoreFilter(storeId) })
                    .populate({ path: "category", select: "name" })
                    .sort({ createdAt: -1 })
                    .lean();
                const resolved = await withStoreOverlay(rows, storeId);
                return resolved.filter((dish) => dish.isAvailable !== false);
            },
            CACHE_TTL
        );
        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        next(error);
    }
}

// New function to toggle dish availability
const toggleDishAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const dish = await Dish.findById(id);
        if (!dish) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        dish.isAvailable = !dish.isAvailable;
        await dish.save();

        const populated = await dish.populate({ path: 'category', select: 'name' });
        
        await invalidateDishCache();
        res.status(200).json({ 
            success: true, 
            message: `Dish ${dish.isAvailable ? 'enabled' : 'disabled'} successfully!`, 
            data: populated 
        });
    } catch (error) {
        next(error);
    }
}

interface DishStoreBody {
    isAvailable?: boolean;
    price?: number | null;
    cost?: number | null;
    sizeVariants?: DishStoreSizeVariantLike[];
}

const validateOverlaySizeVariants = (
    dish: { hasSizeVariants?: boolean; sizeVariants?: Array<{ size: string }> },
    sizeVariants: DishStoreSizeVariantLike[]
) => {
    const catalogSizes = new Set((dish.sizeVariants || []).map((variant) => variant.size));
    const seen = new Set<string>();
    for (const variant of sizeVariants) {
        if (!variant.size || typeof variant.price !== "number" || variant.price < 0) {
            throw createHttpError(400, "Each store size variant must have a valid size and price!");
        }
        if (!SIZE_OPTIONS.includes(variant.size as (typeof SIZE_OPTIONS)[number])) {
            throw createHttpError(400, `Invalid size: ${variant.size}`);
        }
        if (!dish.hasSizeVariants || !catalogSizes.has(variant.size)) {
            throw createHttpError(400, `Store size ${variant.size} is not on this dish`);
        }
        if (typeof variant.cost === "number" && variant.cost < 0) {
            throw createHttpError(400, "Store size cost must be a non-negative number!");
        }
        if (seen.has(variant.size)) {
            throw createHttpError(400, "Store size variant sizes must be unique!");
        }
        seen.add(variant.size);
    }
};

const emptyDishStore = {
    exists: false,
    isAvailable: true,
    price: null,
    cost: null,
    sizeVariants: [],
};

const getDishStore = async (req, res, next) => {
    try {
        const { id } = req.params;
        const storeId = storeIdFromRequest(req);
        if (!storeId) {
            return next(createHttpError(400, "Store selection required. Please select a store."));
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }

        const dish = await Dish.findById(id).lean();
        if (!dish || !dishBelongsToStore(dish, storeId)) {
            return next(createHttpError(404, "Dish not found!"));
        }

        const overlay = await DishStore.findOne({ store: storeId, dish: id }).lean();
        res.status(200).json({
            success: true,
            data: overlay ? { ...overlay, exists: true } : emptyDishStore,
        });
    } catch (error) {
        next(error);
    }
};

const upsertDishStore = async (req, res, next) => {
    try {
        const { id } = req.params;
        const storeId = storeIdFromRequest(req);
        if (!storeId) {
            return next(createHttpError(400, "Store selection required. Please select a store."));
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }

        const dish = await Dish.findById(id);
        if (!dish || !dishBelongsToStore(dish, storeId)) {
            return next(createHttpError(404, "Dish not found!"));
        }

        const body = req.body as DishStoreBody;
        const updates: MongoFilter = {};

        if (body.isAvailable !== undefined) {
            updates.isAvailable = Boolean(body.isAvailable);
        }
        if (Object.prototype.hasOwnProperty.call(body, "price")) {
            if (body.price !== null && (typeof body.price !== "number" || body.price < 0)) {
                return next(createHttpError(400, "Price must be a non-negative number!"));
            }
            updates.price = body.price;
        }
        if (Object.prototype.hasOwnProperty.call(body, "cost")) {
            if (body.cost !== null && (typeof body.cost !== "number" || body.cost < 0)) {
                return next(createHttpError(400, "Cost must be a non-negative number!"));
            }
            updates.cost = body.cost;
        }
        if (Object.prototype.hasOwnProperty.call(body, "sizeVariants")) {
            if (body.sizeVariants !== undefined && !Array.isArray(body.sizeVariants)) {
                return next(createHttpError(400, "sizeVariants must be an array!"));
            }
            const sizeVariants = body.sizeVariants || [];
            validateOverlaySizeVariants(dish, sizeVariants);
            updates.sizeVariants = sizeVariants.map((variant) => ({
                size: variant.size,
                price: variant.price,
                cost: typeof variant.cost === "number" ? variant.cost : 0,
            }));
        }

        const update: MongoFilter = { $setOnInsert: { store: storeId, dish: id } };
        if (Object.keys(updates).length > 0) {
            update.$set = updates;
        }

        const overlay = await DishStore.findOneAndUpdate(
            { store: storeId, dish: id },
            update,
            { new: true, upsert: true, runValidators: true }
        );

        await invalidateDishCache();
        const populated = await Dish.findById(id).populate({ path: "category", select: "name" }).lean();
        res.status(200).json({
            success: true,
            message: "Store dish settings saved!",
            data: applyDishStoreOverlay(populated as DishLike & { _id: { toString(): string } }, overlay),
            overlay,
        });
    } catch (error) {
        next(error);
    }
};

const deleteDishStore = async (req, res, next) => {
    try {
        const { id } = req.params;
        const storeId = storeIdFromRequest(req);
        if (!storeId) {
            return next(createHttpError(400, "Store selection required. Please select a store."));
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid id!"));
        }

        await DishStore.deleteOne({ store: storeId, dish: id });
        await invalidateDishCache();

        const dish = await Dish.findById(id).populate({ path: "category", select: "name" }).lean();
        if (!dish) {
            return next(createHttpError(404, "Dish not found!"));
        }

        res.status(200).json({
            success: true,
            message: "Store dish settings cleared!",
            data: dish,
        });
    } catch (error) {
        next(error);
    }
};

export { 
    addDish, 
    getDishes, 
    getDishById, 
    updateDish, 
    deleteDish, 
    getDishesByCategory,
    getAvailableDishes,
    toggleDishAvailability,
    getDishStore,
    upsertDishStore,
    deleteDishStore
};