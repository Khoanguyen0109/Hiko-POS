import mongoose from "mongoose";

const campaignVoucherSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  participation: { type: mongoose.Schema.Types.ObjectId, ref: "CampaignParticipation", required: true },
  voucherCode: { type: String, required: true, unique: true, uppercase: true },
  qrToken: { type: String, required: true, unique: true },
  rewardType: { type: String, required: true, enum: ["percentage_discount", "free_product"] },
  discountPercent: { type: Number, min: 0, max: 100 },
  freeDish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
  rewardLabel: { type: String, required: true },
  status: { type: String, required: true, enum: ["active", "redeemed", "expired"], default: "active" },
  wonAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date },
  redeemedAt: { type: Date },
  redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  redeemedAtStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
}, { timestamps: true });

campaignVoucherSchema.index({ voucherCode: 1 }, { unique: true });
campaignVoucherSchema.index({ qrToken: 1 }, { unique: true });
campaignVoucherSchema.index({ campaign: 1, status: 1 });

export default mongoose.model("CampaignVoucher", campaignVoucherSchema);
