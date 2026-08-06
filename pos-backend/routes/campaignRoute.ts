import express from "express";
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deactivateCampaign,
  getPublicCampaign,
  playCampaign,
  lookupVoucher,
  getDashboardAnalytics,
  sendCampaignOtp,
  verifyCampaignOtp,
} from "../controllers/campaignController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { campaignPlayLimiter } from "../middlewares/campaignPlayLimiter.js";

const router = express.Router();

router.get("/:slug/public", getPublicCampaign);
router.post("/:slug/otp/send", campaignPlayLimiter, sendCampaignOtp);
router.post("/:slug/otp/verify", campaignPlayLimiter, verifyCampaignOtp);
router.post("/:slug/play", campaignPlayLimiter, playCampaign);
router.post("/:slug/lookup", campaignPlayLimiter, lookupVoucher);

router.use(isVerifiedUser, isAdmin);

router.get("/analytics/dashboard", getDashboardAnalytics);
router.get("/", listCampaigns);
router.post("/", createCampaign);
router.get("/:id", getCampaignById);
router.put("/:id", updateCampaign);
router.delete("/:id", deactivateCampaign);

export default router;
