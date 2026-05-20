import mongoose from "mongoose";
import { DOC_NODE_TYPES, DOC_STATUS } from "../constants/doc.js";

const docNodeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(DOC_NODE_TYPES),
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocNode",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(DOC_STATUS),
      default: DOC_STATUS.DRAFT,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

docNodeSchema.index({ parentId: 1, sortOrder: 1 });
docNodeSchema.index({ status: 1 });
docNodeSchema.index({ type: 1 });

export default mongoose.model("DocNode", docNodeSchema);
