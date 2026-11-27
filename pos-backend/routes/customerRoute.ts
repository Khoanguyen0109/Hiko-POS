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
import { isVerifiedUser, isAdminOrStoreManager } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

router.use(isVerifiedUser);

router.route("/search").get(storeContext, searchCustomers);
router.route("/").post(storeContext, addCustomer);
router.route("/").get(isAdminOrStoreManager, getCustomers);
router.route("/:id").get(storeContext, getCustomerById);
router.route("/:id").put(isAdminOrStoreManager, updateCustomer);
router.route("/:id").delete(isAdminOrStoreManager, deleteCustomer);
router.route("/:id/rewards").get(storeContext, getCustomerRewards);
router.route("/:id/history").get(isAdminOrStoreManager, getCustomerHistory);

export default router;
