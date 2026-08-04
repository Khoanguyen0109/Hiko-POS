import express from "express";
import {
  validateVoucher,
  redeemVoucher,
} from "../controllers/voucherController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.use(isVerifiedUser, storeContext);

router.get("/validate/:qrToken", validateVoucher);
router.post("/redeem", redeemVoucher);

export default router;
