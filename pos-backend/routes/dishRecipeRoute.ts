import express from "express";
import {
    calculateDishCost,
    createOrUpdateRecipe,
    deleteRecipe,
    getAllRecipes,
    getRecipeByDishId,
    recalculateAllCosts,
} from "../controllers/dishRecipeController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.get("/", isVerifiedUser, storeContext, getAllRecipes);
router.post("/", isVerifiedUser, storeContext, isAdmin, createOrUpdateRecipe);
router.post("/recalculate-all", isVerifiedUser, storeContext, isAdmin, recalculateAllCosts);
router.get("/dish/:dishId", isVerifiedUser, storeContext, getRecipeByDishId);
router.get("/dish/:dishId/cost", isVerifiedUser, storeContext, calculateDishCost);
router.delete("/dish/:dishId", isVerifiedUser, storeContext, isAdmin, deleteRecipe);

export default router;
