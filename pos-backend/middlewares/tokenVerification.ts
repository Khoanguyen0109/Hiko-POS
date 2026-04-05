// @ts-nocheck
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from "../models/userModel.js";
import { userRoles } from "../constants/user.js";


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

export { isVerifiedUser, isAdmin };