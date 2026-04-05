import express from "express";
import { addSupplier, getSuppliers, getActiveSuppliers, getSupplierById, updateSupplier, deleteSupplier } from "../controllers/supplierController.js";

import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
const router = express.Router();

// Get active suppliers (for dropdowns - Members + Admin)
router.get("/active", isVerifiedUser, storeContext, getActiveSuppliers);

// Get all suppliers (Members can view, Admin can manage)
router.get("/", isVerifiedUser, storeContext, getSuppliers);

// Get supplier by ID
router.get("/:id", isVerifiedUser, storeContext, getSupplierById);

// Create supplier (Admin only - will be checked in controller if needed)
router.post("/", isVerifiedUser, storeContext, addSupplier);

// Update supplier (Admin only)
router.put("/:id", isVerifiedUser, storeContext, updateSupplier);

// Delete supplier (Admin only)
router.delete("/:id", isVerifiedUser, storeContext, deleteSupplier);

export default router;