const express = require("express");
const { addCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer } = require("../controllers/customerController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");
const { storeContext } = require("../middlewares/storeContext");
const router = express.Router();

router.route("/").post(isVerifiedUser, storeContext, addCustomer);
router.route("/").get(isVerifiedUser, storeContext, isAdmin, getCustomers);
router.route("/:id").get(isVerifiedUser, storeContext, getCustomerById);
router.route("/:id").put(isVerifiedUser, storeContext, updateCustomer);
router.route("/:id").delete(isVerifiedUser, storeContext, isAdmin, deleteCustomer);

module.exports = router; 