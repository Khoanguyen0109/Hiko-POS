// @ts-nocheck
import createHttpError from "http-errors";
import StoreUser from "../models/storeUserModel.js";
import Store from "../models/storeModel.js";
import { userRoles } from "../constants/user.js";

const storeContext = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];

        if (!storeId) {
            return next(createHttpError(400, "Store selection required. Please select a store."));
        }

        // Super-admin bypasses membership check but still loads store
        if (req.user.role === userRoles.ADMIN) {
            const store = await Store.findById(storeId);
            if (!store || !store.isActive) {
                return next(createHttpError(404, "Store not found or inactive."));
            }
            req.store = store;
            req.storeUser = { role: "Owner" };
            return next();
        }

        const storeUser = await StoreUser.findOne({
            user: req.user._id,
            store: storeId,
            isActive: true
        }).populate('store');

        if (!storeUser) {
            return next(createHttpError(403, "You do not have access to this store."));
        }

        if (!storeUser.store || !storeUser.store.isActive) {
            return next(createHttpError(404, "Store not found or inactive."));
        }

        req.store = storeUser.store;
        req.storeUser = storeUser;
        next();
    } catch (error) {
        next(createHttpError(500, "Failed to validate store context."));
    }
};

const isStoreRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (req.user.role === userRoles.ADMIN) {
            return next();
        }

        if (!req.storeUser) {
            return next(createHttpError(403, "Store context required."));
        }

        if (!allowedRoles.includes(req.storeUser.role)) {
            return next(createHttpError(403, "Insufficient store permissions."));
        }

        next();
    };
};

/**
 * Like storeContext but doesn't error for admin when X-Store-Id is missing.
 * If admin has no store header, req.store stays undefined so controllers
 * can aggregate across all stores.
 */
const optionalStoreContext = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];

        if (!storeId) {
            if (req.user.role === userRoles.ADMIN) {
                return next();
            }
            return next(createHttpError(400, "Store selection required. Please select a store."));
        }

        if (req.user.role === userRoles.ADMIN) {
            const store = await Store.findById(storeId);
            if (!store || !store.isActive) {
                return next(createHttpError(404, "Store not found or inactive."));
            }
            req.store = store;
            req.storeUser = { role: "Owner" };
            return next();
        }

        const storeUser = await StoreUser.findOne({
            user: req.user._id,
            store: storeId,
            isActive: true
        }).populate('store');

        if (!storeUser) {
            return next(createHttpError(403, "You do not have access to this store."));
        }

        if (!storeUser.store || !storeUser.store.isActive) {
            return next(createHttpError(404, "Store not found or inactive."));
        }

        req.store = storeUser.store;
        req.storeUser = storeUser;
        next();
    } catch (error) {
        next(createHttpError(500, "Failed to validate store context."));
    }
};

export { storeContext, optionalStoreContext, isStoreRole };