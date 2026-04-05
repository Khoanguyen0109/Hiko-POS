import express from "express";
const router = express.Router();
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
import { processCashPayment, getPaymentByOrderId, getAllPayments } from "../controllers/paymentController.js";
 
router.route("/cash").post(isVerifiedUser, storeContext, processCashPayment);
router.route("/order/:orderId").get(isVerifiedUser, storeContext, getPaymentByOrderId);
router.route("/").get(isVerifiedUser, storeContext, getAllPayments);


export default router;