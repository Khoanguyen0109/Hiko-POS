// pos-backend/models/ticketModel.ts
// @ts-nocheck
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: "Score must be an integer"
        }
    },
    note: {
        type: String,
        trim: true,
        default: ""
    },
    createdBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, trim: true }
    }
}, { timestamps: true });

ticketSchema.index({ store: 1, createdAt: -1 });
ticketSchema.index({ store: 1, member: 1, createdAt: -1 });
ticketSchema.index({ member: 1, createdAt: -1 });

export default mongoose.model("Ticket", ticketSchema);
