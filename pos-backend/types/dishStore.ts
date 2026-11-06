import type { Types } from "mongoose";

export interface DishSizeVariantLike {
    _id?: Types.ObjectId | string;
    size: string;
    price: number;
    cost?: number;
    isDefault?: boolean;
}

export interface DishStoreSizeVariantLike {
    size: string;
    price: number;
    cost?: number;
}

export interface DishLike {
    _id?: Types.ObjectId | string;
    store?: Types.ObjectId | { _id: Types.ObjectId | string } | string | null;
    price: number;
    cost?: number;
    isAvailable?: boolean;
    hasSizeVariants?: boolean;
    sizeVariants?: DishSizeVariantLike[];
}

export interface DishStoreLike {
    store?: Types.ObjectId | string;
    dish?: Types.ObjectId | string;
    isAvailable?: boolean;
    price?: number | null;
    cost?: number | null;
    sizeVariants?: DishStoreSizeVariantLike[] | null;
}

export interface ResolvedSizeVariant {
    _id?: Types.ObjectId | string;
    size: string;
    price: number;
    cost: number;
    isDefault: boolean;
}

export interface ResolvedDishPricing {
    price: number;
    cost: number;
    isAvailable: boolean;
    hasSizeVariants: boolean;
    sizeVariants: ResolvedSizeVariant[];
}

export interface ResolvedUnitPrice {
    price: number;
    cost: number;
    variant?: {
        size: string;
        price: number;
        cost: number;
    };
}
