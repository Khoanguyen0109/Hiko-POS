const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

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

        const user = { name, phone, password, role };
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

        console.log('isUserPresent', isUserPresent)
        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        console.log('isMatch', isMatch)

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
                    isActive: isUserPresent.isActive !== false // Default to true if undefined
                }
            }
        });

    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {
        
        const user = await User.findById(req.user._id);
        
        // Check if user account is inactive
        if(user && user.isActive === false){
            const error = createHttpError(403, "Your account has been deactivated. Please contact administrator.");
            return next(error);
        }
        
        res.status(200).json({success: true, data: user});

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        res.status(200).json({success: true, message: "User logout successfully!"});
    } catch (error) {
        next(error);
    }
}




module.exports = { register, login, getUserData, logout }