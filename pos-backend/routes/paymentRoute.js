const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { storeContext } = require("../middlewares/storeContext");
const { processCashPayment, getPaymentByOrderId, getAllPayments } = require("../controllers/paymentController");
 
router.route("/cash").post(isVerifiedUser, storeContext, processCashPayment);
router.route("/order/:orderId").get(isVerifiedUser, storeContext, getPaymentByOrderId);
router.route("/").get(isVerifiedUser, storeContext, getAllPayments);


module.exports = router;