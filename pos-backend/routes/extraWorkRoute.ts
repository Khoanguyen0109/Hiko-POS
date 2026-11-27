import express from "express";
import { getAllExtraWork, getExtraWorkById, getExtraWorkByMember, createExtraWork, updateExtraWork, deleteExtraWork, approveExtraWork, markAsPaid, getMyExtraWork } from "../controllers/extraWorkController.js";
import { isVerifiedUser, canManageStore } from "../middlewares/tokenVerification.js";
import { storeContext, optionalStoreContext } from "../middlewares/storeContext.js";

const router = express.Router();

// Admin routes
router.route("/")
    .get(isVerifiedUser, optionalStoreContext, canManageStore, getAllExtraWork)
    .post(isVerifiedUser, storeContext, canManageStore, createExtraWork);

// Member routes - view own extra work (must be before /:id route)
router.route("/my-extra-work")
    .get(isVerifiedUser, storeContext, getMyExtraWork);

router.route("/member/:memberId")
    .get(isVerifiedUser, storeContext, canManageStore, getExtraWorkByMember);

router.route("/:id/approve")
    .patch(isVerifiedUser, storeContext, canManageStore, approveExtraWork);

router.route("/:id/mark-paid")
    .patch(isVerifiedUser, storeContext, canManageStore, markAsPaid);

router.route("/:id")
    .get(isVerifiedUser, storeContext, canManageStore, getExtraWorkById)
    .put(isVerifiedUser, storeContext, canManageStore, updateExtraWork)
    .delete(isVerifiedUser, storeContext, canManageStore, deleteExtraWork);

export default router;