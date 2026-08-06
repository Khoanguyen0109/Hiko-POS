import mongoose from "mongoose";

const phoneOtpChallengeSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{10}$/,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

phoneOtpChallengeSchema.index({ phone: 1 }, { unique: true });
phoneOtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PhoneOtpChallenge", phoneOtpChallengeSchema);
