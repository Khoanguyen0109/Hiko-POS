import express from "express";
import {
    searchCustomers,
    addCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerRewards,
    getCustomerHistory
} from "../controllers/customerController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.use(isVerifiedUser);

router.route("/search").get(storeContext, searchCustomers);
router.route("/").post(storeContext, addCustomer);
router.route("/").get(isAdmin, getCustomers);
router.route("/:id").get(storeContext, getCustomerById);
router.route("/:id").put(isAdmin, updateCustomer);
router.route("/:id").delete(isAdmin, deleteCustomer);
router.route("/:id/rewards").get(storeContext, getCustomerRewards);
router.route("/:id/history").get(isAdmin, getCustomerHistory);

export default router;
