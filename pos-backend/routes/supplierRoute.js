const express = require("express");
const {
    addSupplier,
    getSuppliers,
    getActiveSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} = require("../controllers/supplierController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Get active suppliers (for dropdowns - Members + Admin)
router.get("/active", isVerifiedUser, getActiveSuppliers);

// Get all suppliers (Members can view, Admin can manage)
router.get("/", isVerifiedUser, getSuppliers);

// Get supplier by ID
router.get("/:id", isVerifiedUser, getSupplierById);

// Create supplier (Admin only - will be checked in controller if needed)
router.post("/", isVerifiedUser, addSupplier);

// Update supplier (Admin only)
router.put("/:id", isVerifiedUser, updateSupplier);

// Delete supplier (Admin only)
router.delete("/:id", isVerifiedUser, deleteSupplier);

module.exports = router;
