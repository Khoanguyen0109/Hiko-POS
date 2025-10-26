const express = require("express");
const {
    addIngredient,
    getIngredients,
    getIngredientById,
    updateIngredient,
    deleteIngredient,
    getLowStockIngredients,
    getIngredientHistory
} = require("../controllers/ingredientController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Get low stock ingredients (must come before /:id)
router.get("/low-stock", isVerifiedUser, getLowStockIngredients);

// Basic CRUD
router.post("/", isVerifiedUser, addIngredient);
router.get("/", isVerifiedUser, getIngredients);
router.get("/:id", isVerifiedUser, getIngredientById);
router.get("/:id/history", isVerifiedUser, getIngredientHistory);
router.put("/:id", isVerifiedUser, updateIngredient);
router.delete("/:id", isVerifiedUser, deleteIngredient);

module.exports = router;

