import express from "express";
import { getAllToppings, getToppingById, getToppingsByCategory, createTopping, updateTopping, deleteTopping, toggleToppingAvailability } from "../controllers/toppingController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

// Public routes (for ordering)
router.get("/", getAllToppings);
router.get("/by-category", getToppingsByCategory);
router.get("/:toppingId", getToppingById);

// Protected routes (require authentication)
router.use(isVerifiedUser);
router.use(storeContext);

// Admin routes (for topping management)
router.post("/", createTopping);
router.put("/:toppingId", updateTopping);
router.delete("/:toppingId", deleteTopping);
router.patch("/:toppingId/toggle-availability", toggleToppingAvailability);

export default router;