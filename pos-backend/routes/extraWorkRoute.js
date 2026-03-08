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
const { storeContext } = require("../middlewares/storeContext");

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

module.exports = router;

