import createHttpError from "http-errors";
import mongoose from "mongoose";
import Store from "../models/storeModel.js";

export type RelatedStoreRef = {
    storeId: mongoose.Types.ObjectId;
    storeName: string;
};

export async function resolveOtherStore(
    storeId: unknown,
    currentStoreId: mongoose.Types.ObjectId | string,
    fieldLabel: string
): Promise<RelatedStoreRef> {
    if (!storeId || !mongoose.Types.ObjectId.isValid(String(storeId))) {
        throw createHttpError(400, `${fieldLabel} is required`);
    }

    if (String(storeId) === String(currentStoreId)) {
        throw createHttpError(400, `${fieldLabel} cannot be the current store`);
    }

    const store = await Store.findById(storeId).select("name isActive");
    if (!store) {
        throw createHttpError(404, `${fieldLabel} not found`);
    }
    if (!store.isActive) {
        throw createHttpError(400, `${fieldLabel} is not active`);
    }

    return { storeId: store._id, storeName: store.name };
}
