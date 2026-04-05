import express from "express";
import { addOrder, getOrders, getOrderById, updateOrder, updateOrderItems, deleteOrder } from "../controllers/orderController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
const router = express.Router();

router.route("/").post(isVerifiedUser, storeContext, addOrder);
router.route("/").get(isVerifiedUser, storeContext, getOrders);
router.route("/:id").get(isVerifiedUser, storeContext, getOrderById);
router.route("/:id").put(isVerifiedUser, storeContext, updateOrder);
router.route("/:id/items").patch(isVerifiedUser, storeContext, updateOrderItems);
router.route("/:id").delete(isVerifiedUser, storeContext, isAdmin, deleteOrder);

export default router;