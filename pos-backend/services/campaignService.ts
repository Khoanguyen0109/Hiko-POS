import createHttpError from "http-errors";
import mongoose, { type Types } from "mongoose";
import Campaign from "../models/campaignModel.js";
import Dish from "../models/dishModel.js";
import type { WheelSlot } from "../types/campaign.js";

export interface CampaignDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  maxPlaysPerPhone: number;
  wheelSlots: WheelSlot[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignInput {
  name: string;
  slug: string;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
  maxPlaysPerPhone?: number;
  wheelSlots: WheelSlot[];
}

export interface UpdateCampaignInput {
  name?: string;
  slug?: string;
  description?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  isActive?: boolean;
  maxPlaysPerPhone?: number;
  wheelSlots?: WheelSlot[];
}

export interface PlayableResult {
  ok: boolean;
  reason?: string;
}

const SLUG_PATTERN = /^[a-z0-9-]+$/;

function parseOptionalDate(value: Date | string | null | undefined): Date | undefined {
  if (value == null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, "Invalid date value");
  }
  return date;
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export class CampaignService {
  static async listCampaigns(): Promise<CampaignDoc[]> {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .populate("wheelSlots.freeDish", "name price");

    return campaigns as unknown as CampaignDoc[];
  }

  static async getCampaignById(id: string): Promise<CampaignDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await Campaign.findById(id).populate(
      "wheelSlots.freeDish",
      "name price"
    );

    return campaign as CampaignDoc | null;
  }

  static async getCampaignBySlug(slug: string): Promise<CampaignDoc | null> {
    const campaign = await Campaign.findOne({ slug: normalizeSlug(slug) }).populate(
      "wheelSlots.freeDish",
      "name price"
    );

    return campaign as CampaignDoc | null;
  }

  static async createCampaign(
    data: CreateCampaignInput,
    userId: string
  ): Promise<CampaignDoc> {
    if (!data.name?.trim()) {
      throw createHttpError(400, "Name is required");
    }

    if (!data.slug?.trim()) {
      throw createHttpError(400, "Slug is required");
    }

    const slug = normalizeSlug(data.slug);
    if (!SLUG_PATTERN.test(slug)) {
      throw createHttpError(400, "Slug must contain only lowercase letters, numbers, and hyphens");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw createHttpError(400, "Invalid user ID");
    }

    this.validateWheelSlots(data.wheelSlots);
    await this.validateFreeDishes(data.wheelSlots);

    const startDate = parseOptionalDate(data.startDate);
    const endDate = parseOptionalDate(data.endDate);
    this.validateDateRange(startDate, endDate);

    const existing = await Campaign.findOne({ slug });
    if (existing) {
      throw createHttpError(400, "Campaign slug already exists");
    }

    const campaign = await Campaign.create({
      name: data.name.trim(),
      slug,
      description: data.description?.trim() ?? "",
      startDate,
      endDate,
      isActive: data.isActive ?? true,
      maxPlaysPerPhone: data.maxPlaysPerPhone ?? 1,
      wheelSlots: data.wheelSlots,
      createdBy: userId,
    });

    await campaign.populate("wheelSlots.freeDish", "name price");
    return campaign as unknown as CampaignDoc;
  }

  static async updateCampaign(
    id: string,
    data: UpdateCampaignInput
  ): Promise<CampaignDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const existing = await Campaign.findById(id);
    if (!existing) {
      return null;
    }

    const updates: Record<string, unknown> = {};

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw createHttpError(400, "Name cannot be empty");
      }
      updates.name = data.name.trim();
    }

    if (data.slug !== undefined) {
      if (!data.slug.trim()) {
        throw createHttpError(400, "Slug cannot be empty");
      }
      const slug = normalizeSlug(data.slug);
      if (!SLUG_PATTERN.test(slug)) {
        throw createHttpError(
          400,
          "Slug must contain only lowercase letters, numbers, and hyphens"
        );
      }
      const duplicate = await Campaign.findOne({ slug, _id: { $ne: id } });
      if (duplicate) {
        throw createHttpError(400, "Campaign slug already exists");
      }
      updates.slug = slug;
    }

    if (data.description !== undefined) {
      updates.description = data.description.trim();
    }

    if (data.isActive !== undefined) {
      updates.isActive = data.isActive;
    }

    if (data.maxPlaysPerPhone !== undefined) {
      updates.maxPlaysPerPhone = data.maxPlaysPerPhone;
    }

    if (data.wheelSlots !== undefined) {
      this.validateWheelSlots(data.wheelSlots);
      await this.validateFreeDishes(data.wheelSlots);
      updates.wheelSlots = data.wheelSlots;
    }

    const startDate =
      data.startDate !== undefined
        ? parseOptionalDate(data.startDate)
        : existing.startDate ?? undefined;
    const endDate =
      data.endDate !== undefined
        ? parseOptionalDate(data.endDate)
        : existing.endDate ?? undefined;

    if (data.startDate !== undefined) {
      updates.startDate = startDate;
    }
    if (data.endDate !== undefined) {
      updates.endDate = endDate;
    }

    this.validateDateRange(startDate, endDate);

    const campaign = await Campaign.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("wheelSlots.freeDish", "name price");

    return campaign as CampaignDoc | null;
  }

  static async deactivateCampaign(id: string): Promise<CampaignDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, runValidators: true }
    ).populate("wheelSlots.freeDish", "name price");

    return campaign as CampaignDoc | null;
  }

  static isCampaignPlayable(
    campaign: CampaignDoc,
    now: Date = new Date()
  ): PlayableResult {
    if (!campaign.isActive) {
      return { ok: false, reason: "Campaign is not active" };
    }
    if (campaign.startDate && now < campaign.startDate) {
      return { ok: false, reason: "Campaign has not started" };
    }
    if (campaign.endDate && now > campaign.endDate) {
      return { ok: false, reason: "Campaign has ended" };
    }
    return { ok: true };
  }

  private static validateWheelSlots(slots: WheelSlot[]): void {
    if (!Array.isArray(slots) || slots.length < 2) {
      throw createHttpError(400, "Campaign must have at least 2 wheel slots");
    }

    const totalWeight = slots.reduce((sum, slot) => sum + slot.weight, 0);
    if (totalWeight <= 0) {
      throw createHttpError(400, "Total wheel slot weight must be greater than 0");
    }

    for (const slot of slots) {
      if (!slot.label?.trim()) {
        throw createHttpError(400, "Each wheel slot must have a label");
      }

      if (slot.rewardType === "percentage_discount") {
        if (
          slot.discountPercent == null ||
          slot.discountPercent <= 0 ||
          slot.discountPercent > 100
        ) {
          throw createHttpError(
            400,
            `Slot "${slot.label}": discountPercent (1-100) is required for percentage_discount`
          );
        }
      } else if (slot.rewardType === "free_product") {
        if (!slot.freeDish) {
          throw createHttpError(
            400,
            `Slot "${slot.label}": freeDish is required for free_product`
          );
        }
        if (!mongoose.Types.ObjectId.isValid(slot.freeDish)) {
          throw createHttpError(
            400,
            `Slot "${slot.label}": invalid freeDish ID`
          );
        }
      } else if (slot.rewardType === "no_prize") {
        if (slot.discountPercent != null || slot.freeDish) {
          throw createHttpError(
            400,
            `Slot "${slot.label}": no_prize slots must not have discountPercent or freeDish`
          );
        }
      }
    }
  }

  private static async validateFreeDishes(slots: WheelSlot[]): Promise<void> {
    const dishIds = [
      ...new Set(
        slots
          .filter((slot) => slot.rewardType === "free_product" && slot.freeDish)
          .map((slot) => slot.freeDish as string)
      ),
    ];

    if (dishIds.length === 0) {
      return;
    }

    const existingDishes = await Dish.find({ _id: { $in: dishIds } }).select("_id");
    if (existingDishes.length !== dishIds.length) {
      throw createHttpError(400, "Some specified dishes do not exist");
    }
  }

  private static validateDateRange(
    startDate: Date | undefined,
    endDate: Date | undefined
  ): void {
    if (startDate && endDate && endDate <= startDate) {
      throw createHttpError(400, "End date must be after start date");
    }
  }
}
