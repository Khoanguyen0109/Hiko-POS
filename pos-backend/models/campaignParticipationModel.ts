import mongoose from "mongoose";

const campaignParticipationSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  phone: { type: String, required: true, trim: true, match: /^\d{10}$/ },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  playCount: { type: Number, default: 0, min: 0 },
  lastPlayedAt: { type: Date },
}, { timestamps: true });

campaignParticipationSchema.index({ campaign: 1, phone: 1 }, { unique: true });

export default mongoose.model("CampaignParticipation", campaignParticipationSchema);
