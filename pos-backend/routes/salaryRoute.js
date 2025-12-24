const express = require("express");
const { getMonthlySalary, getAllMembersSalarySummary } = require("../controllers/salaryController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

const router = express.Router();

// Get salary summary for all members (Admin only) - Must come before /:year/:month
router.route("/summary/all")
    .get(isVerifiedUser, isAdmin, getAllMembersSalarySummary);

// Get member's monthly salary (member can only view their own)
router.route("/:year/:month")
    .get(isVerifiedUser, getMonthlySalary);

module.exports = router;

