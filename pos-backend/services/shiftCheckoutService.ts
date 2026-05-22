// @ts-nocheck
import createHttpError from "http-errors";
import mongoose from "mongoose";
import type { Types } from "mongoose";
import Order from "../models/orderModel.js";
import Schedule from "../models/scheduleModel.js";
import ShiftCheckout from "../models/shiftCheckoutModel.js";
import ShiftCheckIn from "../models/shiftCheckInModel.js";
import User from "../models/userModel.js";
import {
  attachCheckInsToShiftRows,
  loadCheckInsForSchedules,
} from "./shiftCheckInService.js";
import {
  SHIFT_CHECKOUT_MIN_NOTES_LENGTH,
  SHIFT_CHECKOUT_TOLERANCE_VND,
} from "../constants/shiftCheckout.js";
import { getCurrentVietnamTime, getDateRangeVietnam } from "../utils/dateUtils.js";
import {
  aggregateShiftPayments,
  getShiftPeriod,
  resolveCheckoutStatus,
} from "../utils/shiftWindowUtils.js";
import {
  isManagerOrAbove,
  loadScheduleForCheckout,
  resolveCheckoutMemberId,
} from "../utils/shiftSessionUtils.js";

export { loadScheduleForCheckout, resolveCheckoutMemberId };

interface AuthUser {
  _id: Types.ObjectId;
  role: string;
}

interface StoreContext {
  _id: Types.ObjectId;
}

export async function getExpectedTotalsForSchedule(
  storeId: Types.ObjectId,
  schedule: {
    date: Date;
    shiftTemplate: { startTime: string; endTime: string };
  }
) {
  const { periodStart, periodEnd } = getShiftPeriod(
    schedule.date,
    schedule.shiftTemplate
  );

  const orders = await Order.find({
    store: storeId,
    orderStatus: "completed",
    completedAt: { $gte: periodStart, $lte: periodEnd },
  }).select("orderStatus paymentMethod thirdPartyVendor bills.totalWithTax");

  const totals = aggregateShiftPayments(orders);

  return {
    periodStart,
    periodEnd,
    ...totals,
  };
}

export async function buildCheckoutPreview(
  scheduleId: string,
  store: StoreContext,
  user: AuthUser,
  storeRole?: string,
  memberIdParam?: string
) {
  const schedule = await loadScheduleForCheckout(scheduleId, store._id);
  const targetMemberId = resolveCheckoutMemberId(
    schedule,
    user,
    storeRole,
    memberIdParam
  );

  const expected = await getExpectedTotalsForSchedule(store._id, schedule);

  const [existing, checkIn] = await Promise.all([
    ShiftCheckout.findOne({
      schedule: schedule._id,
      member: targetMemberId,
    }),
    ShiftCheckIn.findOne({
      schedule: schedule._id,
      member: targetMemberId,
    }),
  ]);

  const memberDoc = await User.findById(targetMemberId).select("name email");

  return {
    schedule: {
      _id: schedule._id,
      date: schedule.date,
      shiftTemplate: schedule.shiftTemplate,
    },
    member: memberDoc
      ? { _id: memberDoc._id, name: memberDoc.name, email: memberDoc.email }
      : { _id: targetMemberId },
    checkIn,
    ...expected,
    existingCheckout: existing,
  };
}

export async function submitShiftCheckout(
  scheduleId: string,
  store: StoreContext,
  user: AuthUser,
  body: {
    countedCash: number;
    countedBanking: number;
    notes?: string;
    memberId?: string;
  },
  storeRole?: string
) {
  const schedule = await loadScheduleForCheckout(scheduleId, store._id);
  const targetMemberId = resolveCheckoutMemberId(
    schedule,
    user,
    storeRole,
    body.memberId
  );

  const existing = await ShiftCheckout.findOne({
    schedule: schedule._id,
    member: targetMemberId,
  });
  if (existing) {
    throw createHttpError(409, "Checkout already submitted for this shift");
  }

  const countedCash = Number(body.countedCash);
  const countedBanking = Number(body.countedBanking);
  if (
    Number.isNaN(countedCash) ||
    Number.isNaN(countedBanking) ||
    countedCash < 0 ||
    countedBanking < 0
  ) {
    throw createHttpError(400, "Counted cash and banking must be non-negative numbers");
  }

  const expected = await getExpectedTotalsForSchedule(store._id, schedule);
  const status = resolveCheckoutStatus(
    expected.expectedCash,
    expected.expectedBanking,
    countedCash,
    countedBanking,
    SHIFT_CHECKOUT_TOLERANCE_VND
  );

  const notes = (body.notes || "").trim();
  if (
    status === "mismatch" &&
    notes.length < SHIFT_CHECKOUT_MIN_NOTES_LENGTH
  ) {
    throw createHttpError(
      400,
      `Notes are required when totals do not match (min ${SHIFT_CHECKOUT_MIN_NOTES_LENGTH} characters)`
    );
  }

  const cashDifference = countedCash - expected.expectedCash;
  const bankingDifference = countedBanking - expected.expectedBanking;

  const checkout = await ShiftCheckout.create({
    store: store._id,
    schedule: schedule._id,
    member: targetMemberId,
    shiftDate: schedule.date,
    shiftTemplate: schedule.shiftTemplate._id,
    periodStart: expected.periodStart,
    periodEnd: expected.periodEnd,
    expectedCash: expected.expectedCash,
    expectedBanking: expected.expectedBanking,
    countedCash,
    countedBanking,
    cashDifference,
    bankingDifference,
    status,
    notes,
    orderCount: expected.orderCount,
    submittedAt: getCurrentVietnamTime(),
  });

  await checkout.populate([
    { path: "member", select: "name email" },
    { path: "shiftTemplate", select: "name shortName startTime endTime color" },
    { path: "schedule", select: "date" },
  ]);

  return checkout;
}

export async function getMyShiftCheckoutsForDate(
  storeId: Types.ObjectId,
  memberId: Types.ObjectId,
  dateStr: string
) {
  const { start, end } = getDateRangeVietnam(dateStr, dateStr);

  const schedules = await Schedule.find({
    store: storeId,
    date: { $gte: start, $lte: end },
    "assignedMembers.member": memberId,
  })
    .populate("shiftTemplate")
    .sort({ date: 1 });

  const scheduleIds = schedules.map((s) => s._id);
  const memberDoc = await User.findById(memberId).select("name email");

  const [checkouts, checkIns] = await Promise.all([
    ShiftCheckout.find({
      store: storeId,
      schedule: { $in: scheduleIds },
      member: memberId,
    }),
    loadCheckInsForSchedules(storeId, scheduleIds),
  ]);

  const checkoutByKey = new Map(
    checkouts.map((c) => [
      `${c.schedule.toString()}:${c.member.toString()}`,
      c,
    ])
  );

  const rows = await Promise.all(
    schedules.map(async (schedule) => {
      const checkout = checkoutByKey.get(
        `${schedule._id.toString()}:${memberId.toString()}`
      );
      let expected = null;
      if (!checkout && schedule.shiftTemplate) {
        expected = await getExpectedTotalsForSchedule(storeId, schedule);
      }

      return {
        schedule: {
          _id: schedule._id,
          date: schedule.date,
          shiftTemplate: schedule.shiftTemplate,
        },
        member: memberDoc
          ? { _id: memberDoc._id, name: memberDoc.name, email: memberDoc.email }
          : { _id: memberId },
        checkout: checkout || null,
        expectedPreview: checkout
          ? null
          : expected
            ? {
                expectedCash: expected.expectedCash,
                expectedBanking: expected.expectedBanking,
                orderCount: expected.orderCount,
              }
            : null,
        checkoutStatus: checkout
          ? checkout.status
          : "not_submitted",
      };
    })
  );

  return attachCheckInsToShiftRows(rows, checkIns);
}

/**
 * All store shifts on a date — one row per assigned member (admin / manager).
 */
export async function getStoreShiftCheckoutsForDate(
  storeId: Types.ObjectId,
  dateStr: string
) {
  const { start, end } = getDateRangeVietnam(dateStr, dateStr);

  const schedules = await Schedule.find({
    store: storeId,
    date: { $gte: start, $lte: end },
  })
    .populate("shiftTemplate")
    .populate("assignedMembers.member", "name email")
    .sort({ date: 1 });

  const scheduleIds = schedules.map((s) => s._id);
  const [checkouts, checkIns] = await Promise.all([
    ShiftCheckout.find({
      store: storeId,
      schedule: { $in: scheduleIds },
    }),
    loadCheckInsForSchedules(storeId, scheduleIds),
  ]);

  const checkoutByKey = new Map(
    checkouts.map((c) => [`${c.schedule.toString()}:${c.member.toString()}`, c])
  );

  const rows = [];

  for (const schedule of schedules) {
    if (!schedule.assignedMembers?.length) continue;

    for (const am of schedule.assignedMembers) {
      const memberRef = am.member;
      const memberId =
        memberRef?._id?.toString?.() || memberRef?.toString?.() || memberRef;
      if (!memberId) continue;

      const key = `${schedule._id.toString()}:${memberId}`;
      const checkout = checkoutByKey.get(key) || null;

      let expectedPreview = null;
      if (!checkout && schedule.shiftTemplate) {
        const expected = await getExpectedTotalsForSchedule(storeId, schedule);
        expectedPreview = {
          expectedCash: expected.expectedCash,
          expectedBanking: expected.expectedBanking,
          orderCount: expected.orderCount,
        };
      }

      const member =
        memberRef && typeof memberRef === "object" && memberRef.name
          ? {
              _id: memberRef._id,
              name: memberRef.name,
              email: memberRef.email,
            }
          : { _id: memberId };

      rows.push({
        schedule: {
          _id: schedule._id,
          date: schedule.date,
          shiftTemplate: schedule.shiftTemplate,
        },
        member,
        checkout,
        expectedPreview: checkout ? null : expectedPreview,
        checkoutStatus: checkout ? checkout.status : "not_submitted",
      });
    }
  }

  return attachCheckInsToShiftRows(rows, checkIns);
}

export interface ListShiftCheckoutsFilters {
  startDate: string;
  endDate: string;
  status?: string;
  memberId?: string;
}

export async function listShiftCheckouts(
  storeId: Types.ObjectId,
  filters: ListShiftCheckoutsFilters
) {
  const { start, end } = getDateRangeVietnam(
    filters.startDate,
    filters.endDate
  );

  const query: Record<string, unknown> = {
    store: storeId,
    shiftDate: { $gte: start, $lte: end },
  };

  if (filters.status && ["balanced", "mismatch"].includes(filters.status)) {
    query.status = filters.status;
  }

  if (filters.memberId) {
    query.member = filters.memberId;
  }

  const checkouts = await ShiftCheckout.find(query)
    .populate("member", "name email")
    .populate("shiftTemplate", "name shortName startTime endTime color")
    .populate("schedule", "date")
    .sort({ submittedAt: -1 });

  let balancedCount = 0;
  let mismatchCount = 0;
  let totalCashDifference = 0;
  let totalBankingDifference = 0;

  for (const c of checkouts) {
    if (c.status === "balanced") balancedCount += 1;
    else if (c.status === "mismatch") mismatchCount += 1;
    totalCashDifference += c.cashDifference || 0;
    totalBankingDifference += c.bankingDifference || 0;
  }

  return {
    checkouts,
    summary: {
      totalCount: checkouts.length,
      balancedCount,
      mismatchCount,
      totalCashDifference,
      totalBankingDifference,
    },
  };
}

export async function getDayCheckouts(
  storeId: Types.ObjectId,
  dateStr: string
) {
  const { start, end } = getDateRangeVietnam(dateStr, dateStr);

  const checkouts = await ShiftCheckout.find({
    store: storeId,
    shiftDate: { $gte: start, $lte: end },
  })
    .populate("member", "name email")
    .populate("shiftTemplate", "name shortName startTime endTime color")
    .populate("schedule", "date")
    .sort({ submittedAt: -1 });

  return checkouts;
}

export async function deleteShiftCheckout(
  checkoutId: string,
  storeId: Types.ObjectId
) {
  const checkout = await ShiftCheckout.findOneAndDelete({
    _id: checkoutId,
    store: storeId,
  });

  if (!checkout) {
    throw createHttpError(404, "Shift checkout not found");
  }

  return checkout;
}

export async function getCheckoutById(
  checkoutId: string,
  storeId: Types.ObjectId,
  user: AuthUser,
  storeRole?: string
) {
  const checkout = await ShiftCheckout.findOne({
    _id: checkoutId,
    store: storeId,
  })
    .populate("member", "name email")
    .populate("shiftTemplate", "name shortName startTime endTime color")
    .populate("schedule", "date");

  if (!checkout) {
    throw createHttpError(404, "Shift checkout not found");
  }

  const memberRef = checkout.member;
  const memberIdStr =
    memberRef &&
    typeof memberRef === "object" &&
    "_id" in memberRef
      ? String(memberRef._id)
      : String(memberRef);
  const isOwner = memberIdStr === String(user._id);

  if (!isOwner && !isManagerOrAbove(user.role, storeRole)) {
    throw createHttpError(403, "Insufficient permissions");
  }

  return checkout;
}
