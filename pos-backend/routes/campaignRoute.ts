import express from "express";
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deactivateCampaign,
} from "../controllers/campaignController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";

const router = express.Router();

// Reserved for later tasks — register BEFORE /:id to avoid route conflicts:
// GET  /analytics/dashboard
// GET  /:slug/public
// POST /:slug/play
// POST /:slug/lookup

router.use(isVerifiedUser, isAdmin);

router.get("/", listCampaigns);
router.post("/", createCampaign);
router.get("/:id", getCampaignById);
router.put("/:id", updateCampaign);
router.delete("/:id", deactivateCampaign);

export default router;
