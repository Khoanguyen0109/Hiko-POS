import express from "express";
import { createStorageImport, getStorageImports, getStorageImportById, updateStorageImport, cancelStorageImport } from "../controllers/storageImportController.js";

import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
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

export default router;