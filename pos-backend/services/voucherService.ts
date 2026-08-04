import createHttpError from "http-errors";
import CampaignVoucher from "../models/campaignVoucherModel.js";
import { CampaignService, type CampaignDoc } from "./campaignService.js";
import { maskPhone } from "../utils/campaignUtils.js";

export interface VoucherPreviewDTO {
  valid: boolean;
  status: string;
  rewardLabel: string;
  rewardType: string;
  discountPercent?: number;
  freeDish?: { _id: string; name: string; price?: number };
  voucherCode: string;
  phoneMasked: string;
  expiresAt?: string | null;
  campaignName?: string;
}

export interface VoucherRedeemDTO {
  success: true;
  voucherCode: string;
  rewardLabel: string;
}

interface PopulatedFreeDish {
  _id: { toString(): string };
  name?: string;
  price?: number;
}

interface PopulatedParticipation {
  phone?: string;
}

export class VoucherService {
  static async validate(qrToken: string): Promise<VoucherPreviewDTO> {
    await CampaignService.expireVouchersForEndedCampaigns();
    const voucher = await CampaignVoucher.findOne({ qrToken })
      .populate("campaign")
      .populate("freeDish", "name price")
      .populate("participation", "phone");

    if (!voucher) {
      throw createHttpError(404, "Invalid voucher");
    }

    const participation = voucher.participation as PopulatedParticipation | null;
    const phoneMasked = maskPhone(participation?.phone ?? "");

    let valid = voucher.status === "active";
    let status: string = voucher.status;

    if (valid) {
      const campaign = voucher.campaign as unknown as CampaignDoc | null;
      if (campaign) {
        const playable = CampaignService.isCampaignPlayable(campaign);
        if (!playable.ok) {
          valid = false;
          status = "expired";
        }
      }

      if (valid && voucher.expiresAt && new Date() > voucher.expiresAt) {
        valid = false;
        status = "expired";
      }
    }

    const freeDishDoc = voucher.freeDish as PopulatedFreeDish | null;
    const campaign = voucher.campaign as unknown as CampaignDoc | null;

    return {
      valid,
      status,
      rewardLabel: voucher.rewardLabel,
      rewardType: voucher.rewardType,
      discountPercent: voucher.discountPercent ?? undefined,
      freeDish: freeDishDoc
        ? {
            _id: freeDishDoc._id.toString(),
            name: freeDishDoc.name ?? "",
            price: freeDishDoc.price,
          }
        : undefined,
      voucherCode: voucher.voucherCode,
      phoneMasked,
      expiresAt: voucher.expiresAt?.toISOString() ?? null,
      campaignName: campaign?.name,
    };
  }

  static async redeem(
    qrToken: string,
    userId: string,
    storeId: string
  ): Promise<VoucherRedeemDTO> {
    await CampaignService.expireVouchersForEndedCampaigns();
    const voucher = await CampaignVoucher.findOneAndUpdate(
      { qrToken, status: "active" },
      {
        $set: {
          status: "redeemed",
          redeemedAt: new Date(),
          redeemedBy: userId,
          redeemedAtStore: storeId,
        },
      },
      { new: true }
    );

    if (!voucher) {
      const existing = await CampaignVoucher.findOne({ qrToken });
      if (!existing) {
        throw createHttpError(404, "Invalid voucher");
      }
      if (existing.status === "redeemed") {
        throw createHttpError(400, "Voucher already redeemed");
      }
      if (existing.status === "expired") {
        throw createHttpError(400, "Voucher expired");
      }
      throw createHttpError(400, "Voucher cannot be redeemed");
    }

    return {
      success: true,
      voucherCode: voucher.voucherCode,
      rewardLabel: voucher.rewardLabel,
    };
  }
}
