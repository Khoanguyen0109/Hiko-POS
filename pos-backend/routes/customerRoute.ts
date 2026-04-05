import express from "express";
import { addCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer } from "../controllers/customerController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
const router = express.Router();

router.route("/").post(isVerifiedUser, storeContext, addCustomer);
router.route("/").get(isVerifiedUser, storeContext, isAdmin, getCustomers);
router.route("/:id").get(isVerifiedUser, storeContext, getCustomerById);
router.route("/:id").put(isVerifiedUser, storeContext, updateCustomer);
router.route("/:id").delete(isVerifiedUser, storeContext, isAdmin, deleteCustomer);

export default router;