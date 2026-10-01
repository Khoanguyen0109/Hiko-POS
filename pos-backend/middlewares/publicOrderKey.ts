import crypto from "crypto";
import createHttpError from "http-errors";
import type { NextFunction, Request, Response } from "express";

export function requirePublicOrderKey(req: Request, _res: Response, next: NextFunction): void {
    const expected = process.env.HIKO_ORDER_KEY || "";
    const provided = req.get("x-hiko-order-key") || "";

    if (!expected || expected.length !== provided.length) {
        next(createHttpError(401, "Unauthorized"));
        return;
    }

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);
    if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
        next(createHttpError(401, "Unauthorized"));
        return;
    }

    next();
}
