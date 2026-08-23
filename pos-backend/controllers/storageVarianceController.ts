import type { NextFunction, Request, Response } from "express";
import { resolveAnalyticsStoreScope } from "../utils/analyticsStoreScope.js";
import { computeMaterialVariance } from "../services/varianceService.js";

export const getStorageVariance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const storeScope = await resolveAnalyticsStoreScope(req);
        const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
        const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
        const data = await computeMaterialVariance({ storeScope, startDate, endDate });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
