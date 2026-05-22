import mongoose from "mongoose";

const shiftCheckInSchema = new mongoose.Schema(
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
    openingCash: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: { type: String, default: "", trim: true },
    checkedInAt: { type: Date, required: true },
  },
  { timestamps: true }
);

shiftCheckInSchema.index({ schedule: 1, member: 1 }, { unique: true });
shiftCheckInSchema.index({ store: 1, shiftDate: 1 });

export default mongoose.model("ShiftCheckIn", shiftCheckInSchema);
