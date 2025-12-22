const express = require("express");
const { 
    getAllExtraWork,
    getExtraWorkById,
    getExtraWorkByMember,
    createExtraWork,
    updateExtraWork,
    deleteExtraWork,
    approveExtraWork,
    markAsPaid,
    getMyExtraWork
} = require("../controllers/extraWorkController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

const router = express.Router();

// Admin routes
router.route("/")
    .get(isVerifiedUser, isAdmin, getAllExtraWork)
    .post(isVerifiedUser, isAdmin, createExtraWork);

// Member routes - view own extra work (must be before /:id route)
router.route("/my-extra-work")
    .get(isVerifiedUser, getMyExtraWork);

router.route("/member/:memberId")
    .get(isVerifiedUser, isAdmin, getExtraWorkByMember);

router.route("/:id/approve")
    .patch(isVerifiedUser, isAdmin, approveExtraWork);

router.route("/:id/mark-paid")
    .patch(isVerifiedUser, isAdmin, markAsPaid);

router.route("/:id")
    .get(isVerifiedUser, isAdmin, getExtraWorkById)
    .put(isVerifiedUser, isAdmin, updateExtraWork)
    .delete(isVerifiedUser, isAdmin, deleteExtraWork);

module.exports = router;

