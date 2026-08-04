import createHttpError from "http-errors";
import mongoose from "mongoose";
import {
  CampaignService,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "../services/campaignService.js";

const listCampaigns = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const campaigns = await CampaignService.listCampaigns();
    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

const getCampaignById = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid campaign ID"));
    }

    const campaign = await CampaignService.getCampaignById(id);
    if (!campaign) {
      return next(createHttpError(404, "Campaign not found"));
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

const createCampaign = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const body = req.body as CreateCampaignInput;

    if (!body.name || !body.slug || !body.wheelSlots) {
      return next(
        createHttpError(400, "Name, slug, and wheelSlots are required")
      );
    }

    const campaign = await CampaignService.createCampaign(body, String(userId));

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

const updateCampaign = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid campaign ID"));
    }

    const campaign = await CampaignService.updateCampaign(
      id,
      req.body as UpdateCampaignInput
    );

    if (!campaign) {
      return next(createHttpError(404, "Campaign not found"));
    }

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

const deactivateCampaign = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid campaign ID"));
    }

    const campaign = await CampaignService.deactivateCampaign(id);
    if (!campaign) {
      return next(createHttpError(404, "Campaign not found"));
    }

    res.status(200).json({
      success: true,
      message: "Campaign deactivated successfully",
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

const getPublicCampaign = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const campaign = await CampaignService.getPublicCampaign(slug);
    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

const playCampaign = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const phone = (req.body as { phone?: string }).phone;

    if (!phone) {
      return next(createHttpError(400, "Phone is required"));
    }

    const result = await CampaignService.playCampaign(slug, phone.trim());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const lookupVoucher = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const phone = (req.body as { phone?: string }).phone;

    if (!phone) {
      return next(createHttpError(400, "Phone is required"));
    }

    const result = await CampaignService.lookupVoucher(slug, phone.trim());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deactivateCampaign,
  getPublicCampaign,
  playCampaign,
  lookupVoucher,
};
