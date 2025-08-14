const express = require("express");
const { addCategory, getCategories, getCategoryById, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

router.route("/").post(isVerifiedUser, addCategory);
router.route("/").get(isVerifiedUser, getCategories);
router.route("/:id").get(isVerifiedUser, getCategoryById);
router.route("/:id").put(isVerifiedUser, updateCategory);
router.route("/:id").delete(isVerifiedUser, deleteCategory);

module.exports = router; 