const express = require("express");
const { getMonthlySalary, getAllMembersSalarySummary } = require("../controllers/salaryController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");
const { storeContext } = require("../middlewares/storeContext");

const router = express.Router();

// Get salary summary for all members (Admin only) - Must come before /:year/:month
router.route("/summary/all")
    .get(isVerifiedUser, storeContext, isAdmin, getAllMembersSalarySummary);

// Get member's monthly salary (member can only view their own)
router.route("/:year/:month")
    .get(isVerifiedUser, storeContext, getMonthlySalary);

module.exports = router;

