import createHttpError from "http-errors";
import mongoose, { type Types } from "mongoose";
import Campaign from "../models/campaignModel.js";
import CampaignParticipation from "../models/campaignParticipationModel.js";
import CampaignVoucher from "../models/campaignVoucherModel.js";
import Customer from "../models/customerModel.js";
import Dish from "../models/dishModel.js";
import type {
  LookupResult,
  PlayCampaignResult,
  PlayResultWin,
  PublicCampaignDTO,
  WheelSlot,
} from "../types/campaign.js";
import {
  generateQrToken,
  generateVoucherCode,
  pickWeightedSlot,
} from "../utils/campaignUtils.js";

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
const PHONE_PATTERN = /^\d{10}$/;

interface ParticipationDoc {
  _id: Types.ObjectId;
  campaign: Types.ObjectId;
  phone: string;
  customer?: Types.ObjectId;
  playCount: number;
  lastPlayedAt?: Date;
}

interface VoucherDoc {
  _id: Types.ObjectId;
  voucherCode: string;
  qrToken: string;
  rewardType: "percentage_discount" | "free_product";
  discountPercent?: number;
  freeDish?: Types.ObjectId;
  rewardLabel: string;
  status: "active" | "redeemed" | "expired";
  expiresAt?: Date;
  redeemedAt?: Date;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

function optionalNumber(value: number | null | undefined): number | undefined {
  return value ?? undefined;
}

function freeDishToString(freeDish: unknown): string | undefined {
  if (freeDish == null) return undefined;
  return String(freeDish);
}

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

  static async getPublicCampaign(slug: string): Promise<PublicCampaignDTO> {
    const campaign = await Campaign.findOne({ slug: normalizeSlug(slug) }).select(
      "name description wheelSlots.label wheelSlots.color"
    );

    if (!campaign) {
      throw createHttpError(404, "Campaign not found");
    }

    const wheelSlots = campaign.wheelSlots.map((slot) => ({
      label: slot.label,
      color: slot.color,
    }));

    return {
      name: campaign.name,
      description: campaign.description ?? "",
      wheelSlots,
    };
  }

  static async expireVouchersForEndedCampaigns(): Promise<number> {
    const now = new Date();
    const endedCampaignIds = await Campaign.find({ endDate: { $lte: now } }).distinct(
      "_id"
    );
    const result = await CampaignVoucher.updateMany(
      {
        status: "active",
        $or: [
          { expiresAt: { $lte: now } },
          { campaign: { $in: endedCampaignIds } },
        ],
      },
      { $set: { status: "expired" } }
    );
    return result.modifiedCount;
  }

  static async playCampaign(
    slug: string,
    phone: string
  ): Promise<PlayCampaignResult> {
    await this.expireVouchersForEndedCampaigns();
    this.validatePhone(phone);

    const campaign = await Campaign.findOne({ slug: normalizeSlug(slug) });
    if (!campaign) {
      throw createHttpError(404, "Campaign not found");
    }

    const campaignDoc = campaign as unknown as CampaignDoc;
    const playable = this.isCampaignPlayable(campaignDoc);
    if (!playable.ok) {
      throw createHttpError(400, playable.reason ?? "Campaign is not playable");
    }

    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({ phone, name: "" });
    }

    let participation = await this.atomicPlayIncrement(
      campaign._id,
      phone,
      customer._id,
      campaign.maxPlaysPerPhone
    );

    if (!participation) {
      const existing = await CampaignParticipation.findOne({
        campaign: campaign._id,
        phone,
      });

      if (existing && existing.playCount >= campaign.maxPlaysPerPhone) {
        return this.buildMaxPlaysResponse(
          campaign._id,
          existing as ParticipationDoc,
          campaign.maxPlaysPerPhone
        );
      }

      throw createHttpError(400, "Unable to record play attempt");
    }

    const playsRemaining = Math.max(
      0,
      campaign.maxPlaysPerPhone - participation.playCount
    );
    const slot = pickWeightedSlot(campaign.wheelSlots as WheelSlot[]);

    if (slot.rewardType === "no_prize") {
      return {
        result: "lose",
        message: "Try again next time",
        playsRemaining,
      };
    }

    const voucher = await CampaignVoucher.create({
      campaign: campaign._id,
      participation: participation._id,
      voucherCode: generateVoucherCode(),
      qrToken: generateQrToken(),
      rewardType: slot.rewardType,
      discountPercent: slot.discountPercent,
      freeDish: slot.freeDish,
      rewardLabel: slot.label,
      expiresAt: campaign.endDate ?? undefined,
    });

    return this.buildWinResult(
      slot,
      voucher as VoucherDoc,
      playsRemaining
    );
  }

  static async lookupVoucher(slug: string, phone: string): Promise<LookupResult> {
    await this.expireVouchersForEndedCampaigns();
    this.validatePhone(phone);

    const campaign = await Campaign.findOne({ slug: normalizeSlug(slug) });
    if (!campaign) {
      throw createHttpError(404, "Campaign not found");
    }

    const participation = await CampaignParticipation.findOne({
      campaign: campaign._id,
      phone,
    });

    if (!participation) {
      return {
        status: "none",
        message: "No voucher found for this phone number",
      };
    }

    const vouchers = await CampaignVoucher.find({
      campaign: campaign._id,
      participation: participation._id,
    }).sort({ wonAt: -1 });

    if (vouchers.length === 0) {
      return {
        status: "none",
        message: "No voucher found for this phone number",
      };
    }

    const activeVoucher = vouchers.find((voucher) => voucher.status === "active");
    if (activeVoucher) {
      const playable = this.isCampaignPlayable(campaign as unknown as CampaignDoc);
      if (!playable.ok) {
        return {
          status: "expired",
          message: playable.reason ?? "Voucher expired",
        };
      }

      return this.buildLookupActive(activeVoucher as VoucherDoc);
    }

    const redeemedVoucher = vouchers.find((voucher) => voucher.status === "redeemed");
    if (redeemedVoucher?.redeemedAt) {
      return {
        status: "redeemed",
        message: `Used on ${redeemedVoucher.redeemedAt.toLocaleDateString()}`,
        redeemedAt: redeemedVoucher.redeemedAt.toISOString(),
      };
    }

    return {
      status: "expired",
      message: "Voucher expired",
    };
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

  private static validatePhone(phone: string): void {
    if (!PHONE_PATTERN.test(phone)) {
      throw createHttpError(400, "Phone number must be a 10-digit number");
    }
  }

  private static async atomicPlayIncrement(
    campaignId: Types.ObjectId,
    phone: string,
    customerId: Types.ObjectId,
    maxPlaysPerPhone: number
  ): Promise<ParticipationDoc | null> {
    const now = new Date();

    const updated = await CampaignParticipation.findOneAndUpdate(
      {
        campaign: campaignId,
        phone,
        playCount: { $lt: maxPlaysPerPhone },
      },
      {
        $inc: { playCount: 1 },
        $set: { lastPlayedAt: now, customer: customerId },
      },
      { new: true }
    );

    if (updated) {
      return updated as ParticipationDoc;
    }

    const existing = await CampaignParticipation.findOne({ campaign: campaignId, phone });
    if (existing) {
      return null;
    }

    try {
      const created = await CampaignParticipation.create({
        campaign: campaignId,
        phone,
        customer: customerId,
        playCount: 1,
        lastPlayedAt: now,
      });
      return created as ParticipationDoc;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }

    return CampaignParticipation.findOneAndUpdate(
      {
        campaign: campaignId,
        phone,
        playCount: { $lt: maxPlaysPerPhone },
      },
      {
        $inc: { playCount: 1 },
        $set: { lastPlayedAt: now, customer: customerId },
      },
      { new: true }
    ) as Promise<ParticipationDoc | null>;
  }

  private static buildWinResult(
    slot: WheelSlot,
    voucher: VoucherDoc,
    playsRemaining: number
  ): PlayResultWin {
    return {
      result: "win",
      reward: {
        label: slot.label,
        type: slot.rewardType as "percentage_discount" | "free_product",
        discountPercent: slot.discountPercent,
        freeDish: freeDishToString(slot.freeDish),
      },
      voucher: {
        code: voucher.voucherCode,
        qrToken: voucher.qrToken,
        expiresAt: voucher.expiresAt?.toISOString() ?? null,
      },
      playsRemaining,
    };
  }

  private static buildLookupActive(voucher: VoucherDoc): LookupResult {
    return {
      status: "active",
      reward: {
        label: voucher.rewardLabel,
        type: voucher.rewardType,
        discountPercent: optionalNumber(voucher.discountPercent),
        freeDish: freeDishToString(voucher.freeDish),
      },
      voucher: {
        code: voucher.voucherCode,
        qrToken: voucher.qrToken,
        expiresAt: voucher.expiresAt?.toISOString() ?? null,
      },
    };
  }

  private static async buildMaxPlaysResponse(
    campaignId: Types.ObjectId,
    participation: ParticipationDoc,
    maxPlaysPerPhone: number
  ): Promise<PlayCampaignResult> {
    const existingVoucher = await CampaignVoucher.findOne({
      campaign: campaignId,
      participation: participation._id,
      status: "active",
    });

    if (existingVoucher) {
      return {
        result: "win",
        reward: {
          label: existingVoucher.rewardLabel,
          type: existingVoucher.rewardType,
          discountPercent: optionalNumber(existingVoucher.discountPercent),
          freeDish: freeDishToString(existingVoucher.freeDish),
        },
        voucher: {
          code: existingVoucher.voucherCode,
          qrToken: existingVoucher.qrToken,
          expiresAt: existingVoucher.expiresAt?.toISOString() ?? null,
        },
        playsRemaining: Math.max(0, maxPlaysPerPhone - participation.playCount),
      };
    }

    return {
      result: "no_plays_remaining",
      message: "You have already played",
    };
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
