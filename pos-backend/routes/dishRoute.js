const express = require("express");
const { addDish, getDishes, getDishById, updateDish, deleteDish, getDishesByCategory } = require("../controllers/dishController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

router.route("/").post(isVerifiedUser, addDish);
router.route("/").get(isVerifiedUser, getDishes);
router.route("/category/:categoryId").get(isVerifiedUser, getDishesByCategory);
router.route("/:id").get(isVerifiedUser, getDishById);
router.route("/:id").put(isVerifiedUser, updateDish);
router.route("/:id").delete(isVerifiedUser, deleteDish);

module.exports = router; 