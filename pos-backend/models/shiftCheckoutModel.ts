import mongoose from "mongoose";

const shiftCheckoutSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shiftDate: {
      type: Date,
      required: true,
      index: true,
    },
    shiftTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShiftTemplate",
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    expectedCash: { type: Number, required: true, min: 0, default: 0 },
    expectedBanking: { type: Number, required: true, min: 0, default: 0 },
    countedCash: { type: Number, required: true, min: 0 },
    countedBanking: { type: Number, required: true, min: 0 },
    cashDifference: { type: Number, required: true },
    bankingDifference: { type: Number, required: true },
    status: {
      type: String,
      enum: ["balanced", "mismatch"],
      required: true,
    },
    notes: { type: String, default: "", trim: true },
    orderCount: { type: Number, required: true, min: 0, default: 0 },
    submittedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

shiftCheckoutSchema.index({ schedule: 1, member: 1 }, { unique: true });
shiftCheckoutSchema.index({ store: 1, shiftDate: 1 });

export default mongoose.model("ShiftCheckout", shiftCheckoutSchema);
