import express from "express";
import { getAllMembers, getMemberById, createMember, updateMember, deleteMember, toggleMemberActiveStatus, getMemberStores, updateMemberStores, getOwnProfile, updateOwnProfile, changePassword } from "../controllers/memberController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
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

// Member store assignments (admin only)
router.route("/:id/stores")
    .get(isVerifiedUser, isAdmin, getMemberStores)
    .put(isVerifiedUser, isAdmin, updateMemberStores);

// Admin routes with ID parameter - require admin privileges
router.route("/:id")
    .get(isVerifiedUser, isAdmin, getMemberById)
    .put(isVerifiedUser, isAdmin, updateMember)
    .delete(isVerifiedUser, isAdmin, deleteMember);

// Toggle member active status
router.route("/:id/toggle-active")
    .patch(isVerifiedUser, isAdmin, toggleMemberActiveStatus);

export default router;