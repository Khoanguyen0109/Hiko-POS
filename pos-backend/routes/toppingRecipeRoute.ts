import express from "express";
import {
    calculateToppingCost,
    createOrUpdateToppingRecipe,
    deleteToppingRecipe,
    getAllToppingRecipes,
    getToppingRecipeByToppingId,
    recalculateAllToppingCosts,
} from "../controllers/toppingRecipeController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.get("/", isVerifiedUser, storeContext, getAllToppingRecipes);
router.post("/", isVerifiedUser, storeContext, isAdmin, createOrUpdateToppingRecipe);
router.post("/recalculate-all", isVerifiedUser, storeContext, isAdmin, recalculateAllToppingCosts);
router.get("/topping/:toppingId", isVerifiedUser, storeContext, getToppingRecipeByToppingId);
router.get("/topping/:toppingId/cost", isVerifiedUser, storeContext, calculateToppingCost);
router.delete("/topping/:toppingId", isVerifiedUser, storeContext, isAdmin, deleteToppingRecipe);

export default router;
