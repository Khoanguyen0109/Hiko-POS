import express from "express";
import { createStorageExport, getStorageExports, getStorageExportById, updateStorageExport, cancelStorageExport } from "../controllers/storageExportController.js";

import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
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

export default router;