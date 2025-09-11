const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");
const { userRoles } = require("../constants/user");


const isVerifiedUser = async (req, res, next) => {
    try{

        console.log('req.cookies', req.cookies)
        console.log('req.headers.cookie', req.headers.cookie)
        console.log('req.headers', req.headers)
        const { accessToken } = req.cookies;
        
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

module.exports = { isVerifiedUser, isAdmin };