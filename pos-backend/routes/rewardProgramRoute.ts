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
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";

const router = express.Router();
router.use(isVerifiedUser);

router.route("/analytics").get(isAdmin, getRewardAnalytics);
router.route("/backfill-categories").post(isAdmin, backfillCategoryDishCounts);
router.route("/").get(getRewardPrograms);
router.route("/").post(isAdmin, addRewardProgram);
router.route("/:id").get(getRewardProgramById);
router.route("/:id").put(isAdmin, updateRewardProgram);
router.route("/:id/toggle-status").patch(isAdmin, toggleRewardProgramStatus);
router.route("/:id").delete(isAdmin, deleteRewardProgram);

export default router;
