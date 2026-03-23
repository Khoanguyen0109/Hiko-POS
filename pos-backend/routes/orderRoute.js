const express = require("express");
const { addOrder, getOrders, getOrderById, updateOrder, updateOrderItems, deleteOrder } = require("../controllers/orderController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");
const { storeContext } = require("../middlewares/storeContext");
const router = express.Router();

router.route("/").post(isVerifiedUser, storeContext, addOrder);
router.route("/").get(isVerifiedUser, storeContext, getOrders);
router.route("/:id").get(isVerifiedUser, storeContext, getOrderById);
router.route("/:id").put(isVerifiedUser, storeContext, updateOrder);
router.route("/:id/items").patch(isVerifiedUser, storeContext, updateOrderItems);
router.route("/:id").delete(isVerifiedUser, storeContext, isAdmin, deleteOrder);

module.exports = router;