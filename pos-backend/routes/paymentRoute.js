const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { processCashPayment, getPaymentByOrderId, getAllPayments } = require("../controllers/paymentController");
 
router.route("/cash").post(isVerifiedUser, processCashPayment);
router.route("/order/:orderId").get(isVerifiedUser, getPaymentByOrderId);
router.route("/").get(isVerifiedUser, getAllPayments);


module.exports = router;