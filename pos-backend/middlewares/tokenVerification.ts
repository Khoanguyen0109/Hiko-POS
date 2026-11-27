// @ts-nocheck
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from "../models/userModel.js";
import { userRoles, isStoreManagerRole } from "../constants/user.js";
import StoreUser from "../models/storeUserModel.js";


const isVerifiedUser = async (req, res, next) => {
    try{
        // Prefer httpOnly cookie; fall back to Bearer header for API clients
        const cookieToken = req.cookies?.accessToken;
        const authHeader = req.headers.authorization;
        const accessToken = cookieToken ||
            (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
        
        if(!accessToken){
            const error = createHttpError(401, "Please provide token!");
            return next(error);
        }

        const decodeToken = jwt.verify(accessToken, config.accessTokenSecret);

        const user = await User.findById(decodeToken._id);
        if(!user){
            const error = createHttpError(401, "User not exist!");
            return next(error);
        }

        // Check if user account is inactive
        if(user.isActive === false){
            const error = createHttpError(403, "Your account has been deactivated. Please contact administrator.");
            return next(error);
        }

        req.user = user;
        next();

    }catch (error) {
        const err = createHttpError(401, "Invalid Token!");
        next(err);
    }
}

const isAdmin = (req, res, next) => {
    try {
        if(!req.user){
            const error = createHttpError(401, "Unauthorized!");
            return next(error);
        }

        if(req.user.role !== userRoles.ADMIN){
            const error = createHttpError(403, "Access denied! Admins only.");
            return next(error);
        }

        next();
    } catch (error) {
        const err = createHttpError(403, "Access denied!");
        next(err);
    }
}

// Admin, or a store manager acting on a store they belong to.
// Store context must already have verified the assignment.
const canManageStore = (req, res, next) => {
    if (!req.user) {
        return next(createHttpError(401, "Unauthorized!"));
    }

    if (req.user.role === userRoles.ADMIN) {
        return next();
    }

    if (isStoreManagerRole(req.user.role) && req.store) {
        return next();
    }

    return next(createHttpError(403, "Access denied."));
};

// Admin, or a store manager who is assigned to at least one store.
const isAdminOrStoreManager = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(createHttpError(401, "Unauthorized!"));
        }

        if (req.user.role === userRoles.ADMIN) {
            return next();
        }

        if (!isStoreManagerRole(req.user.role)) {
            return next(createHttpError(403, "Access denied."));
        }

        if (req.store) {
            return next();
        }

        const assigned = await StoreUser.exists({
            user: req.user._id,
            isActive: true
        });

        if (!assigned) {
            return next(createHttpError(403, "No store assigned."));
        }

        return next();
    } catch (error) {
        return next(createHttpError(403, "Access denied."));
    }
};

export { isVerifiedUser, isAdmin, canManageStore, isAdminOrStoreManager };