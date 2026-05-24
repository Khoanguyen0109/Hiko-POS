// @ts-nocheck
import createHttpError from "http-errors";
import { formatVietnamTime } from "../utils/dateUtils.js";
import { isStoreRole } from "../middlewares/storeContext.js";
import mongoose from "mongoose";
import {
  buildCheckoutPreview,
  getCheckoutById,
  getDayCheckouts,
  getStoreShiftCheckoutsForDate,
  listShiftCheckouts,
  submitShiftCheckout,
  deleteShiftCheckout,
} from "../services/shiftCheckoutService.js";
import { submitShiftCheckIn } from "../services/shiftCheckInService.js";

const getPreview = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    if (!scheduleId) {
      return next(createHttpError(400, "Schedule ID is required"));
    }

    const { memberId } = req.query;

    const data = await buildCheckoutPreview(
      scheduleId,
      req.store,
      req.user,
      req.storeUser?.role,
      memberId ? String(memberId) : undefined
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const submitCheckout = async (req, res, next) => {
  try {
    const { scheduleId, countedCash, countedBanking, notes, memberId } = req.body;

    if (!scheduleId) {
      return next(createHttpError(400, "scheduleId is required"));
    }

    const checkout = await submitShiftCheckout(
      scheduleId,
      req.store,
      req.user,
      { countedCash, countedBanking, notes, memberId },
      req.storeUser?.role
    );

    res.status(201).json({
      success: true,
      message:
        checkout.status === "balanced"
          ? "Shift checkout submitted — totals match"
          : "Shift checkout submitted — totals do not match",
      data: checkout,
    });
  } catch (error) {
    next(error);
  }
};

const getMyToday = async (req, res, next) => {
  try {
    const dateStr =
      req.query.date ||
      formatVietnamTime(new Date(), "yyyy-MM-dd");

    const data = await getStoreShiftCheckoutsForDate(
      req.store._id,
      dateStr,
      req.user._id
    );

    res.status(200).json({
      success: true,
      date: dateStr,
      count: data.length,
      view: "store",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDay = async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return next(createHttpError(400, "Date must be YYYY-MM-DD"));
    }

    const data = await getDayCheckouts(req.store._id, date);

    res.status(200).json({
      success: true,
      date,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getList = async (req, res, next) => {
  try {
    const { startDate, endDate, status, memberId } = req.query;

    if (!startDate || !endDate) {
      return next(
        createHttpError(400, "startDate and endDate are required (YYYY-MM-DD)")
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(String(startDate)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))
    ) {
      return next(createHttpError(400, "Dates must be YYYY-MM-DD"));
    }

    if (status && status !== "all" && !["balanced", "mismatch"].includes(status)) {
      return next(createHttpError(400, "status must be balanced or mismatch"));
    }

    if (memberId && !mongoose.Types.ObjectId.isValid(String(memberId))) {
      return next(createHttpError(400, "Invalid memberId"));
    }

    const data = await listShiftCheckouts(req.store._id, {
      startDate: String(startDate),
      endDate: String(endDate),
      status: status && status !== "all" ? String(status) : undefined,
      memberId: memberId ? String(memberId) : undefined,
    });

    res.status(200).json({
      success: true,
      data,
      filters: {
        startDate,
        endDate,
        status: status || "all",
        memberId: memberId || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await getCheckoutById(
      id,
      req.store._id,
      req.user,
      req.storeUser?.role
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const submitCheckIn = async (req, res, next) => {
  try {
    const { scheduleId, openingCash, notes, memberId } = req.body;

    if (!scheduleId) {
      return next(createHttpError(400, "scheduleId is required"));
    }

    const checkIn = await submitShiftCheckIn(
      scheduleId,
      req.store._id,
      req.user,
      { openingCash, notes, memberId },
      req.storeUser?.role
    );

    res.status(201).json({
      success: true,
      message: "Shift check-in recorded",
      data: checkIn,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCheckout = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid checkout ID"));
    }

    const deleted = await deleteShiftCheckout(id, req.store._id);

    res.status(200).json({
      success: true,
      message: "Shift checkout deleted successfully",
      data: { _id: deleted._id, schedule: deleted.schedule },
    });
  } catch (error) {
    next(error);
  }
};

export {
  getPreview,
  submitCheckout,
  submitCheckIn,
  getMyToday,
  getDay,
  getList,
  getById,
  deleteCheckout,
};
