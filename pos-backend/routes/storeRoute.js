const express = require("express");
const {
    createStore,
    getAllStores,
    getMyStores,
    getStoreById,
    updateStore,
    deleteStore,
    getStoreMembers,
    addStoreMember,
    updateStoreMemberRole,
    removeStoreMember
} = require("../controllers/storeController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");
const { storeContext, isStoreRole } = require("../middlewares/storeContext");

const router = express.Router();

// Get stores the current user belongs to
router.get("/my-stores", isVerifiedUser, getMyStores);

// Super-admin: list all stores & create new
router.get("/", isVerifiedUser, isAdmin, getAllStores);
router.post("/", isVerifiedUser, isAdmin, createStore);

// Store-specific routes (require store context)
router.get("/:id", isVerifiedUser, getStoreById);
router.put("/:id", isVerifiedUser, isAdmin, updateStore);
router.delete("/:id", isVerifiedUser, isAdmin, deleteStore);

// Store member management (require store context via x-store-id header)
router.get("/:id/members", isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), getStoreMembers);
router.post("/:id/members", isVerifiedUser, storeContext, isStoreRole("Owner"), addStoreMember);
router.put("/:id/members/:userId", isVerifiedUser, storeContext, isStoreRole("Owner"), updateStoreMemberRole);
router.delete("/:id/members/:userId", isVerifiedUser, storeContext, isStoreRole("Owner"), removeStoreMember);

module.exports = router;
