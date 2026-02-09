const express = require("express");
const {
    createStorageExport,
    getStorageExports,
    getStorageExportById,
    updateStorageExport,
    cancelStorageExport
} = require("../controllers/storageExportController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Get all export records
router.get("/", isVerifiedUser, getStorageExports);

// Get export record by ID
router.get("/:id", isVerifiedUser, getStorageExportById);

// Create export record (Members + Admin)
router.post("/", isVerifiedUser, createStorageExport);

// Update export record (Members + Admin)
router.put("/:id", isVerifiedUser, updateStorageExport);

// Cancel export record (Members + Admin)
router.patch("/:id/cancel", isVerifiedUser, cancelStorageExport);

module.exports = router;
