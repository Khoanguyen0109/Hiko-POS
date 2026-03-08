const express = require("express");
const {
    createStorageImport,
    getStorageImports,
    getStorageImportById,
    updateStorageImport,
    cancelStorageImport
} = require("../controllers/storageImportController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { storeContext } = require("../middlewares/storeContext");
const router = express.Router();

// Get all import records
router.get("/", isVerifiedUser, storeContext, getStorageImports);

// Get import record by ID
router.get("/:id", isVerifiedUser, storeContext, getStorageImportById);

// Create import record (Members + Admin)
router.post("/", isVerifiedUser, storeContext, createStorageImport);

// Update import record (Members + Admin)
router.put("/:id", isVerifiedUser, storeContext, updateStorageImport);

// Cancel import record (Members + Admin)
router.patch("/:id/cancel", isVerifiedUser, storeContext, cancelStorageImport);

module.exports = router;
