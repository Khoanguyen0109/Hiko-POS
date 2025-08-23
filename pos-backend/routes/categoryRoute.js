const express = require("express");
const { 
    addCategory, 
    getCategories, 
    getActiveCategories,
    getCategoryById, 
    updateCategory, 
    deleteCategory,
    toggleCategoryStatus
} = require("../controllers/categoryController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Category CRUD routes
router.route("/").post(isVerifiedUser, addCategory);
router.route("/").get(isVerifiedUser, getCategories);
router.route("/active").get(isVerifiedUser, getActiveCategories);
router.route("/:id").get(isVerifiedUser, getCategoryById);
router.route("/:id").put(isVerifiedUser, updateCategory);
router.route("/:id").delete(isVerifiedUser, deleteCategory);
router.route("/:id/toggle-status").patch(isVerifiedUser, toggleCategoryStatus);

module.exports = router; 