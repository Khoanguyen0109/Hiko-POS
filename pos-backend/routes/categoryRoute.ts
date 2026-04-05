import express from "express";
import { addCategory, getCategories, getActiveCategories, getCategoryById, updateCategory, deleteCategory, toggleCategoryStatus } from "../controllers/categoryController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
const router = express.Router();

router.route("/").post(isVerifiedUser, addCategory);
router.route("/").get(isVerifiedUser, getCategories);
router.route("/active").get(isVerifiedUser, getActiveCategories);
router.route("/:id").get(isVerifiedUser, getCategoryById);
router.route("/:id").put(isVerifiedUser, updateCategory);
router.route("/:id").delete(isVerifiedUser, deleteCategory);
router.route("/:id/toggle-status").patch(isVerifiedUser, toggleCategoryStatus);

export default router;