import express from "express";
import { addDish, getDishes, getDishById, updateDish, deleteDish, getDishesByCategory, getAvailableDishes, toggleDishAvailability } from "../controllers/dishController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
const router = express.Router();

router.route("/").post(isVerifiedUser, addDish);
router.route("/").get(isVerifiedUser, getDishes);
router.route("/available").get(isVerifiedUser, getAvailableDishes);
router.route("/category/:categoryId").get(isVerifiedUser, getDishesByCategory);
router.route("/:id").get(isVerifiedUser, getDishById);
router.route("/:id").put(isVerifiedUser, updateDish);
router.route("/:id").delete(isVerifiedUser, deleteDish);
router.route("/:id/toggle-availability").patch(isVerifiedUser, toggleDishAvailability);

export default router;