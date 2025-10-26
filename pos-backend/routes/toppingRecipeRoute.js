const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");

const {
  createOrUpdateToppingRecipe,
  getAllToppingRecipes,
  getToppingRecipeByToppingId,
  deleteToppingRecipe,
  calculateToppingRecipeCost,
  recalculateAllToppingCosts,
  cloneToppingRecipe
} = require("../controllers/toppingRecipeController");

// Create or update a topping recipe
router.post("/", isVerifiedUser, createOrUpdateToppingRecipe);

// Get all topping recipes with optional filters
router.get("/", isVerifiedUser, getAllToppingRecipes);

// Recalculate all topping costs
router.post("/recalculate-all", isVerifiedUser, recalculateAllToppingCosts);

// Get recipe for a specific topping
router.get("/topping/:toppingId", isVerifiedUser, getToppingRecipeByToppingId);

// Calculate cost for a specific topping recipe
router.get("/topping/:toppingId/cost", isVerifiedUser, calculateToppingRecipeCost);

// Delete a topping recipe
router.delete("/topping/:toppingId", isVerifiedUser, deleteToppingRecipe);

// Clone a topping recipe
router.post("/topping/:toppingId/clone", isVerifiedUser, cloneToppingRecipe);

module.exports = router;

