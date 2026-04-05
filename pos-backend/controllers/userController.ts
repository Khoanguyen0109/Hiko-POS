// @ts-nocheck
import type { RegisterUserPayload } from "../types/user.js";

import createHttpError from "http-errors";
import User from "../models/userModel.js";
import StoreUser from "../models/storeUserModel.js";
import Store from "../models/storeModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

const register = async (req, res, next) => {
    try {

        const { name, phone, email, password, role } = req.body;

        if(!name || !phone || !password || !role){
            const error = createHttpError(400, "Name, phone, password and role are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({phone});
        if(isUserPresent){
            const error = createHttpError(400, "User with this phone number already exists!");
            return next(error);
        }

        const user: RegisterUserPayload = { name, phone, password, role };
        if (email) user.email = email; // Only add email if provided
        const newUser = User(user);
        await newUser.save();

        res.status(201).json({success: true, message: "New user created!", data: newUser});

    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {

    try {
        
        const { phone, password } = req.body;

        if(!phone || !password) {
            const error = createHttpError(400, "Phone and password are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({phone});
        if(!isUserPresent){
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);

        if(!isMatch){
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        // Check if user account is inactive
        if(isUserPresent.isActive === false){
            const error = createHttpError(403, "Your account has been deactivated. Please contact administrator.");
            return next(error);
        }

        const accessToken = jwt.sign({_id: isUserPresent._id}, config.accessTokenSecret, {
            expiresIn : '1d'
        });

        // Set JWT as httpOnly cookie (not readable by JS)
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: config.nodeEnv === 'production',
            sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day in ms
        });

        // Fetch user's stores
        let stores = [];
        if (isUserPresent.role === 'Admin') {
            const allStores = await Store.find({ isActive: true }).lean();
            stores = allStores.map(s => ({
                _id: s._id,
                name: s.name,
                code: s.code,
                address: s.address,
                role: "Owner"
            }));
        } else {
            const storeUsers = await StoreUser.find({
                user: isUserPresent._id,
                isActive: true
            }).populate({
                path: 'store',
                match: { isActive: true }
            }).lean();

            stores = storeUsers
                .filter(su => su.store)
                .map(su => ({
                    _id: su.store._id,
                    name: su.store.name,
                    code: su.store.code,
                    address: su.store.address,
                    role: su.role
                }));
        }

        res.status(200).json({
            success: true, 
            message: "User login successfully!", 
            data: {
                accessToken,
                user: {
                    _id: isUserPresent._id,
                    name: isUserPresent.name,
                    phone: isUserPresent.phone,
                    email: isUserPresent.email,
                    role: isUserPresent.role,
                    isActive: isUserPresent.isActive !== false
                },
                stores
            }
        });

    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {
        
        const user = await User.findById(req.user._id);
        
        if(user && user.isActive === false){
            const error = createHttpError(403, "Your account has been deactivated. Please contact administrator.");
            return next(error);
        }

        let stores = [];
        if (user.role === 'Admin') {
            const allStores = await Store.find({ isActive: true }).lean();
            stores = allStores.map(s => ({
                _id: s._id,
                name: s.name,
                code: s.code,
                address: s.address,
                role: "Owner"
            }));
        } else {
            const storeUsers = await StoreUser.find({
                user: user._id,
                isActive: true
            }).populate({
                path: 'store',
                match: { isActive: true }
            }).lean();

            stores = storeUsers
                .filter(su => su.store)
                .map(su => ({
                    _id: su.store._id,
                    name: su.store.name,
                    code: su.store.code,
                    address: su.store.address,
                    role: su.role
                }));
        }
        
        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                stores
            }
        });

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: config.nodeEnv === 'production',
            sameSite: config.nodeEnv === 'production' ? 'none' : 'lax'
        });
        res.status(200).json({success: true, message: "User logout successfully!"});
    } catch (error) {
        next(error);
    }
}




export { register, login, getUserData, logout };