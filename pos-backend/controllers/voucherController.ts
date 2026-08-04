import createHttpError from "http-errors";
import { VoucherService } from "../services/voucherService.js";

const validateVoucher = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const qrToken = String(req.params.qrToken ?? "").trim();
    if (!qrToken) {
      return next(createHttpError(400, "QR token is required"));
    }

    const preview = await VoucherService.validate(qrToken);
    res.status(200).json({ success: true, data: preview });
  } catch (error) {
    next(error);
  }
};

const redeemVoucher = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    const userId = req.user?._id;
    const storeId = req.store?._id;

    if (!userId) {
      return next(createHttpError(401, "Unauthorized"));
    }
    if (!storeId) {
      return next(createHttpError(400, "Store context required"));
    }

    const { qrToken } = req.body as { qrToken?: string };
    if (!qrToken?.trim()) {
      return next(createHttpError(400, "qrToken is required"));
    }

    const result = await VoucherService.redeem(
      qrToken.trim(),
      String(userId),
      String(storeId)
    );

    res.status(200).json({
      success: true,
      message: "Voucher redeemed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export { validateVoucher, redeemVoucher };
