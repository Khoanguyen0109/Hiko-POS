const express = require("express");
const {
    createStorageImport,
    getStorageImports,
    getStorageImportById,
    updateStorageImport,
    cancelStorageImport
} = require("../controllers/storageImportController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Get all import records
router.get("/", isVerifiedUser, getStorageImports);

// Get import record by ID
router.get("/:id", isVerifiedUser, getStorageImportById);

// Create import record (Members + Admin)
router.post("/", isVerifiedUser, createStorageImport);

// Update import record (Members + Admin)
router.put("/:id", isVerifiedUser, updateStorageImport);

// Cancel import record (Members + Admin)
router.patch("/:id/cancel", isVerifiedUser, cancelStorageImport);

module.exports = router;
