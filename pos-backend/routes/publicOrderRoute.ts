import express from "express";
import { requirePublicOrderKey } from "../middlewares/publicOrderKey.js";
import { publicOrderLimiter } from "../middlewares/publicOrderLimiter.js";
import {
    listPublicStores,
    getPublicMenu,
    createPublicOrder,
    getPublicReceipt,
} from "../controllers/publicOrderController.js";

const router = express.Router();

router.use(requirePublicOrderKey);
router.get("/stores", listPublicStores);
router.get("/stores/:id/menu", getPublicMenu);
router.post("/orders", publicOrderLimiter, createPublicOrder);
router.get("/orders/:token", getPublicReceipt);

export default router;
