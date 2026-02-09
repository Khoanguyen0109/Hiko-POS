const express = require("express");
const {
    addStorageItem,
    getStorageItems,
    getStorageItemById,
    updateStorageItem,
    deleteStorageItem,
    getLowStockItems
} = require("../controllers/storageItemController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Get low stock items (must come before /:id)
router.get("/low-stock", isVerifiedUser, getLowStockItems);

// Get all storage items
router.get("/", isVerifiedUser, getStorageItems);

// Get storage item by ID
router.get("/:id", isVerifiedUser, getStorageItemById);

// Create storage item (Admin only)
router.post("/", isVerifiedUser, addStorageItem);

// Update storage item (Admin only)
router.put("/:id", isVerifiedUser, updateStorageItem);

// Delete storage item (Admin only)
router.delete("/:id", isVerifiedUser, deleteStorageItem);

module.exports = router;
