import express from "express";
import {
    addRewardProgram,
    getRewardPrograms,
    getRewardProgramById,
    updateRewardProgram,
    toggleRewardProgramStatus,
    deleteRewardProgram,
    getRewardAnalytics,
    backfillCategoryDishCounts,
} from "../controllers/rewardProgramController.js";
import { isVerifiedUser, isAdmin, isAdminOrStoreManager } from "../middlewares/tokenVerification.js";
import { optionalStoreContext } from "../middlewares/storeContext.js";

const router = express.Router();
router.use(isVerifiedUser);

router.route("/analytics").get(optionalStoreContext, isAdminOrStoreManager, getRewardAnalytics);
router.route("/backfill-categories").post(isAdmin, backfillCategoryDishCounts);
router.route("/").get(getRewardPrograms);
router.route("/").post(isAdminOrStoreManager, addRewardProgram);
router.route("/:id").get(getRewardProgramById);
router.route("/:id").put(isAdminOrStoreManager, updateRewardProgram);
router.route("/:id/toggle-status").patch(isAdminOrStoreManager, toggleRewardProgramStatus);
router.route("/:id").delete(isAdminOrStoreManager, deleteRewardProgram);

export default router;
