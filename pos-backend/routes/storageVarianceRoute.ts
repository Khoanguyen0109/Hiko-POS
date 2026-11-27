import express from "express";
import { getStorageVariance } from "../controllers/storageVarianceController.js";
import { isVerifiedUser, canManageStore } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.get("/", isVerifiedUser, storeContext, canManageStore, getStorageVariance);

export default router;
