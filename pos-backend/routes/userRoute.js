const express = require("express");
const { register, login, getUserData, logout } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const validate = require("../middlewares/validate");
const { registerSchema, loginSchema } = require("../validators/userValidator");
const router = express.Router();

router.route("/register").post(validate(registerSchema), register);
router.route("/login").post(validate(loginSchema), login);
router.route("/logout").post(isVerifiedUser, logout);
router.route("/").get(isVerifiedUser, getUserData);

module.exports = router;
