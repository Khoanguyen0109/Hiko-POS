import express from "express";
import { getStorageVariance } from "../controllers/storageVarianceController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.get("/", isVerifiedUser, storeContext, isAdmin, getStorageVariance);

export default router;
