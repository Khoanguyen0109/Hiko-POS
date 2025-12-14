const express = require("express");
const { getMonthlySalary } = require("../controllers/salaryController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");

const router = express.Router();

// Get member's monthly salary (member can only view their own)
router.route("/:year/:month")
    .get(isVerifiedUser, getMonthlySalary);

module.exports = router;

