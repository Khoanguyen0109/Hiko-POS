import express from "express";
import {
  getPreview,
  submitCheckout,
  submitCheckIn,
  getMyToday,
  getDay,
  getList,
  getById,
  deleteCheckout,
} from "../controllers/shiftCheckoutController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext, isStoreRole } from "../middlewares/storeContext.js";

const router = express.Router();

router
  .route("/my-today")
  .get(isVerifiedUser, storeContext, getMyToday);

router
  .route("/list")
  .get(isVerifiedUser, storeContext, isAdmin, getList);

router
  .route("/day/:date")
  .get(
    isVerifiedUser,
    storeContext,
    isStoreRole("Owner", "Manager"),
    getDay
  );

router
  .route("/preview/:scheduleId")
  .get(isVerifiedUser, storeContext, getPreview);

router
  .route("/check-in")
  .post(isVerifiedUser, storeContext, submitCheckIn);

router.route("/").post(isVerifiedUser, storeContext, submitCheckout);

router
  .route("/:id")
  .get(isVerifiedUser, storeContext, getById)
  .delete(isVerifiedUser, storeContext, isAdmin, deleteCheckout);

export default router;
