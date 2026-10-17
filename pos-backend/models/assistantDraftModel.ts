import mongoose from "mongoose";

const draftSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
        kind: {
            type: String,
            enum: ["import", "export", "assign", "transfer"],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "committed", "canceled"],
            default: "pending",
        },
        payload: { type: mongoose.Schema.Types.Mixed, required: true },
        blockers: { type: [String], default: [] },
    },
    { timestamps: true }
);

draftSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default mongoose.model("AssistantDraft", draftSchema);
