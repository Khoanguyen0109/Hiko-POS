const express = require("express");
const { addTable, getTables, updateTable } = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { storeContext } = require("../middlewares/storeContext");
 
router.route("/").post(isVerifiedUser, storeContext, addTable);
router.route("/").get(isVerifiedUser, storeContext, getTables);
router.route("/:id").put(isVerifiedUser, storeContext, updateTable);

module.exports = router;