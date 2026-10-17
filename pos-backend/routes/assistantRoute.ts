import express from "express";
import rateLimit from "express-rate-limit";
import { cancel, capabilities, chat, commit } from "../controllers/assistantController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

const assistantLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(assistantLimiter);
router.get("/capabilities", isVerifiedUser, storeContext, capabilities);
router.post("/chat", isVerifiedUser, storeContext, chat);
router.post("/commit", isVerifiedUser, storeContext, commit);
router.post("/cancel", isVerifiedUser, storeContext, cancel);

export default router;
