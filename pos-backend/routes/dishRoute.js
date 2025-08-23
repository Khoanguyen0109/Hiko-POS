const express = require("express");
const { 
    addDish, 
    getDishes, 
    getDishById, 
    updateDish, 
    deleteDish, 
    getDishesByCategory,
    getAvailableDishes,
    toggleDishAvailability
} = require("../controllers/dishController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Dish CRUD routes
router.route("/").post(isVerifiedUser, addDish);
router.route("/").get(isVerifiedUser, getDishes);
router.route("/available").get(isVerifiedUser, getAvailableDishes);
router.route("/category/:categoryId").get(isVerifiedUser, getDishesByCategory);
router.route("/:id").get(isVerifiedUser, getDishById);
router.route("/:id").put(isVerifiedUser, updateDish);
router.route("/:id").delete(isVerifiedUser, deleteDish);
router.route("/:id/toggle-availability").patch(isVerifiedUser, toggleDishAvailability);

module.exports = router; 