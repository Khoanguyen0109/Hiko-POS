const express = require("express");
const {
  getAllToppings,
  getToppingById,
  getToppingsByCategory,
  createTopping,
  updateTopping,
  deleteTopping,
  toggleToppingAvailability
} = require("../controllers/toppingController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");

const router = express.Router();

// Public routes (for ordering)
router.get("/", getAllToppings);
router.get("/by-category", getToppingsByCategory);
router.get("/:toppingId", getToppingById);

// Protected routes (require authentication)
router.use(isVerifiedUser);

// Admin routes (for topping management)
router.post("/", createTopping);
router.put("/:toppingId", updateTopping);
router.delete("/:toppingId", deleteTopping);
router.patch("/:toppingId/toggle-availability", toggleToppingAvailability);

module.exports = router;


