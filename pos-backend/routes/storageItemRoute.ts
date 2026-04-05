import express from "express";
import { addStorageItem, getStorageItems, getStorageItemById, updateStorageItem, deleteStorageItem, getLowStockItems } from "../controllers/storageItemController.js";

import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
const router = express.Router();

// Get low stock items (must come before /:id)
router.get("/low-stock", isVerifiedUser, storeContext, getLowStockItems);

// Get all storage items
router.get("/", isVerifiedUser, storeContext, getStorageItems);

// Get storage item by ID
router.get("/:id", isVerifiedUser, storeContext, getStorageItemById);

// Create storage item (Admin only)
router.post("/", isVerifiedUser, storeContext, isAdmin, addStorageItem);

// Update storage item (Admin only)
router.put("/:id", isVerifiedUser, storeContext, isAdmin, updateStorageItem);

// Delete storage item (Admin only)
router.delete("/:id", isVerifiedUser, storeContext, isAdmin, deleteStorageItem);

export default router;