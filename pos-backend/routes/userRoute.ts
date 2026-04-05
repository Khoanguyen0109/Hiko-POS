import express from "express";
import { register, login, getUserData, logout } from "../controllers/userController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import validate from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validators/userValidator.js";
const router = express.Router();

router.route("/register").post(validate(registerSchema), register);
router.route("/login").post(validate(loginSchema), login);
router.route("/logout").post(isVerifiedUser, logout);
router.route("/").get(isVerifiedUser, getUserData);

export default router;