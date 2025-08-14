const express = require("express");
const { addCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer } = require("../controllers/customerController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");
const router = express.Router();

router.route("/").post(isVerifiedUser, addCustomer);
router.route("/").get(isVerifiedUser, isAdmin, getCustomers);
router.route("/:id").get(isVerifiedUser, getCustomerById);
router.route("/:id").put(isVerifiedUser, updateCustomer);
router.route("/:id").delete(isVerifiedUser, isAdmin, deleteCustomer);

module.exports = router; 