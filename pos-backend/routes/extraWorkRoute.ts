import express from "express";
import { getAllExtraWork, getExtraWorkById, getExtraWorkByMember, createExtraWork, updateExtraWork, deleteExtraWork, approveExtraWork, markAsPaid, getMyExtraWork } from "../controllers/extraWorkController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

// Admin routes
router.route("/")
    .get(isVerifiedUser, storeContext, isAdmin, getAllExtraWork)
    .post(isVerifiedUser, storeContext, isAdmin, createExtraWork);

// Member routes - view own extra work (must be before /:id route)
router.route("/my-extra-work")
    .get(isVerifiedUser, storeContext, getMyExtraWork);

router.route("/member/:memberId")
    .get(isVerifiedUser, storeContext, isAdmin, getExtraWorkByMember);

router.route("/:id/approve")
    .patch(isVerifiedUser, storeContext, isAdmin, approveExtraWork);

router.route("/:id/mark-paid")
    .patch(isVerifiedUser, storeContext, isAdmin, markAsPaid);

router.route("/:id")
    .get(isVerifiedUser, storeContext, isAdmin, getExtraWorkById)
    .put(isVerifiedUser, storeContext, isAdmin, updateExtraWork)
    .delete(isVerifiedUser, storeContext, isAdmin, deleteExtraWork);

export default router;