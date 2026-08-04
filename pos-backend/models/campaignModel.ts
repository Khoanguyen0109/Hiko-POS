import mongoose from "mongoose";
import type { WheelSlot } from "../types/campaign.js";

const wheelSlotSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true, maxlength: 100 },
  rewardType: {
    type: String,
    required: true,
    enum: ["percentage_discount", "free_product", "no_prize"],
  },
  discountPercent: { type: Number, min: 0, max: 100 },
  freeDish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
  weight: { type: Number, required: true, min: 1 },
  color: { type: String, required: true, match: /^#[0-9A-Fa-f]{6}$/ },
}, { _id: true });

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/,
  },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  maxPlaysPerPhone: { type: Number, default: 1, min: 1 },
  wheelSlots: {
    type: [wheelSlotSchema],
    validate: {
      validator: (v: WheelSlot[]) => Array.isArray(v) && v.length >= 2,
      message: "Campaign must have at least 2 wheel slots",
    },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

campaignSchema.index({ slug: 1 }, { unique: true });
campaignSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

export default mongoose.model("Campaign", campaignSchema);
