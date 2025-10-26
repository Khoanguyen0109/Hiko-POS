const express = require("express");
const {
    createOrUpdateRecipe,
    getRecipeByDishId,
    getAllRecipes,
    deleteRecipe,
    recalculateAllCosts,
    calculateDishCost,
    exportIngredientsForOrder,
    checkIngredientAvailability
} = require("../controllers/dishRecipeController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Recipe CRUD
router.post("/", isVerifiedUser, createOrUpdateRecipe);
router.get("/", isVerifiedUser, getAllRecipes);
router.get("/dish/:dishId", isVerifiedUser, getRecipeByDishId);
router.delete("/dish/:dishId", isVerifiedUser, deleteRecipe);

// Cost calculations
router.post("/recalculate-all", isVerifiedUser, recalculateAllCosts);
router.get("/dish/:dishId/cost", isVerifiedUser, calculateDishCost);

// Inventory management
router.post("/export-for-order", isVerifiedUser, exportIngredientsForOrder);
router.post("/check-availability", isVerifiedUser, checkIngredientAvailability);

module.exports = router;

