const express = require("express");
const {
    createStorageExport,
    getStorageExports,
    getStorageExportById,
    updateStorageExport,
    cancelStorageExport
} = require("../controllers/storageExportController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { storeContext } = require("../middlewares/storeContext");
const router = express.Router();

// Get all export records
router.get("/", isVerifiedUser, storeContext, getStorageExports);

// Get export record by ID
router.get("/:id", isVerifiedUser, storeContext, getStorageExportById);

// Create export record (Members + Admin)
router.post("/", isVerifiedUser, storeContext, createStorageExport);

// Update export record (Members + Admin)
router.put("/:id", isVerifiedUser, storeContext, updateStorageExport);

// Cancel export record (Members + Admin)
router.patch("/:id/cancel", isVerifiedUser, storeContext, cancelStorageExport);

module.exports = router;
