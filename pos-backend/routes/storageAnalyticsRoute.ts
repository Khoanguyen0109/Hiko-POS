import express from "express";
import { getStorageAnalytics } from "../controllers/storageItemController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

// Get storage analytics (Admin only)
router.get("/", isVerifiedUser, storeContext, isAdmin, getStorageAnalytics);

export default router;