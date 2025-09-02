const express = require("express");
const { 
    getAllMembers, 
    getMemberById, 
    createMember, 
    updateMember, 
    deleteMember,
    getOwnProfile,
    updateOwnProfile,
    changePassword
} = require("../controllers/memberController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");
const router = express.Router();

// Admin routes - require admin privileges
router.route("/")
    .get(isVerifiedUser, isAdmin, getAllMembers)
    .post(isVerifiedUser, isAdmin, createMember);

// Member routes - require authentication (MUST come before /:id routes)
router.route("/profile")
    .get(isVerifiedUser, getOwnProfile)
    .put(isVerifiedUser, updateOwnProfile);

router.route("/change-password")
    .put(isVerifiedUser, changePassword);

// Admin routes with ID parameter - require admin privileges
router.route("/:id")
    .get(isVerifiedUser, isAdmin, getMemberById)
    .put(isVerifiedUser, isAdmin, updateMember)
    .delete(isVerifiedUser, isAdmin, deleteMember);

module.exports = router; 