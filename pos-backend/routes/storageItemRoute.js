const express = require("express");
const {
    addStorageItem,
    getStorageItems,
    getStorageItemById,
    updateStorageItem,
    deleteStorageItem,
    getLowStockItems
} = require("../controllers/storageItemController");

const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");
const router = express.Router();

// Get low stock items (must come before /:id)
router.get("/low-stock", isVerifiedUser, getLowStockItems);

// Get all storage items
router.get("/", isVerifiedUser, getStorageItems);

// Get storage item by ID
router.get("/:id", isVerifiedUser, getStorageItemById);

// Create storage item (Admin only)
router.post("/", isVerifiedUser, isAdmin, addStorageItem);

// Update storage item (Admin only)
router.put("/:id", isVerifiedUser, isAdmin, updateStorageItem);

// Delete storage item (Admin only)
router.delete("/:id", isVerifiedUser, isAdmin, deleteStorageItem);

module.exports = router;
