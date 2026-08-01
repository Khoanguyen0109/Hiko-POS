import createHttpError from "http-errors";
import Store from "../models/storeModel.js";
import { userRoles } from "../constants/user.js";
import type { Request } from "express";
import type { Types } from "mongoose";

interface StoreInfo {
  _id: Types.ObjectId;
  name: string;
  code: string;
}

export interface AnalyticsStoreScope {
  scope: "all" | "single";
  stores: StoreInfo[];
  storeIds: Types.ObjectId[];
  /** For $match: single id or { $in: ids } */
  storeMatch: Types.ObjectId | { $in: Types.ObjectId[] } | null;
  /** Pass to model statics that accept storeId (null = all stores) */
  storeIdForStatics: Types.ObjectId | null;
}

export async function resolveAnalyticsStoreScope(req: Request): Promise<AnalyticsStoreScope> {
  const scopeAll = req.query.scope === "all";
  const isAdmin = req.user?.role === userRoles.ADMIN;

  if (scopeAll && !isAdmin) {
    throw createHttpError(403, "Admin access required for all-stores view");
  }

  if (scopeAll && isAdmin) {
    const stores = await Store.find({ isActive: true })
      .select("_id name code")
      .sort({ name: 1 })
      .lean<StoreInfo[]>();

    const storeIds = stores.map((s) => s._id);

    return {
      scope: "all",
      stores,
      storeIds,
      storeMatch: storeIds.length > 0 ? { $in: storeIds } : null,
      storeIdForStatics: null,
    };
  }

  const storeId = req.store?._id ?? null;
  const storeDoc = req.store as StoreInfo | undefined;

  return {
    scope: "single",
    stores: storeDoc
      ? [{ _id: storeDoc._id, name: storeDoc.name, code: storeDoc.code }]
      : [],
    storeIds: storeId ? [storeId] : [],
    storeMatch: storeId,
    storeIdForStatics: storeId,
  };
}
