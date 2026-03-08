const express = require("express");
const { getStorageAnalytics } = require("../controllers/storageItemController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");
const { storeContext } = require("../middlewares/storeContext");

const router = express.Router();

// Get storage analytics (Admin only)
router.get("/", isVerifiedUser, storeContext, isAdmin, getStorageAnalytics);

module.exports = router;
