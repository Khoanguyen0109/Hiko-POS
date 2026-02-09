const express = require("express");
const { getStorageAnalytics } = require("../controllers/storageItemController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

const router = express.Router();

// Get storage analytics (Admin only)
router.get("/", isVerifiedUser, isAdmin, getStorageAnalytics);

module.exports = router;
