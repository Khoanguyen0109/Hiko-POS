import express from "express";
import {
    addDish,
    getDishes,
    getDishById,
    updateDish,
    deleteDish,
    getDishesByCategory,
    getAvailableDishes,
    toggleDishAvailability,
    getDishStore,
    upsertDishStore,
    deleteDishStore,
} from "../controllers/dishController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { optionalStoreContext, storeContext } from "../middlewares/storeContext.js";
const router = express.Router();

router.route("/").post(isVerifiedUser, addDish);
router.route("/").get(isVerifiedUser, optionalStoreContext, getDishes);
router.route("/available").get(isVerifiedUser, optionalStoreContext, getAvailableDishes);
router.route("/category/:categoryId").get(isVerifiedUser, optionalStoreContext, getDishesByCategory);
router.route("/:id/store").get(isVerifiedUser, storeContext, getDishStore);
router.route("/:id/store").put(isVerifiedUser, storeContext, isAdmin, upsertDishStore);
router.route("/:id/store").delete(isVerifiedUser, storeContext, isAdmin, deleteDishStore);
router.route("/:id").get(isVerifiedUser, optionalStoreContext, getDishById);
router.route("/:id").put(isVerifiedUser, updateDish);
router.route("/:id").delete(isVerifiedUser, deleteDish);
router.route("/:id/toggle-availability").patch(isVerifiedUser, toggleDishAvailability);

export default router;