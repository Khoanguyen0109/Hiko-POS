import express from "express";
import { getStorageAnalytics } from "../controllers/storageItemController.js";
import { isVerifiedUser, canManageStore } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

// Get storage analytics (Admin only)
router.get("/", isVerifiedUser, storeContext, canManageStore, getStorageAnalytics);

export default router;