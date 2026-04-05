import express from "express";
import { getMonthlySalary, getAllMembersSalarySummary } from "../controllers/salaryController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

// Get salary summary for all members (Admin only) - Must come before /:year/:month
router.route("/summary/all")
    .get(isVerifiedUser, storeContext, isAdmin, getAllMembersSalarySummary);

// Get member's monthly salary (member can only view their own)
router.route("/:year/:month")
    .get(isVerifiedUser, storeContext, getMonthlySalary);

export default router;