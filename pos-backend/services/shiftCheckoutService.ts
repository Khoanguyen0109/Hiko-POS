// @ts-nocheck
import createHttpError from "http-errors";
import type { Types } from "mongoose";
import Order from "../models/orderModel.js";
import Schedule from "../models/scheduleModel.js";
import ShiftCheckout from "../models/shiftCheckoutModel.js";
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

type StoreRole = "Owner" | "Manager" | "Staff";

interface AuthUser {
  _id: Types.ObjectId;
  role: string;
}

interface StoreContext {
  _id: Types.ObjectId;
}

function isManagerOrAbove(
  userRole: string,
  storeRole?: StoreRole | string
): boolean {
  if (userRole === "Admin") return true;
  return storeRole === "Owner" || storeRole === "Manager";
}

export async function loadScheduleForCheckout(
  scheduleId: string,
  storeId: Types.ObjectId
) {
  const schedule = await Schedule.findOne({ _id: scheduleId, store: storeId })
    .populate("shiftTemplate");

  if (!schedule) {
    throw createHttpError(404, "Schedule not found");
  }

  if (!schedule.shiftTemplate) {
    throw createHttpError(400, "Schedule has no shift template");
  }

  return schedule;
}

export function assertMemberAssigned(
  schedule: { assignedMembers: { member: Types.ObjectId }[] },
  memberId: Types.ObjectId
) {
  const assigned = schedule.assignedMembers.some(
    (am) => am.member.toString() === memberId.toString()
  );
  if (!assigned) {
    throw createHttpError(403, "You are not assigned to this shift");
  }
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
  storeRole?: string
) {
  const schedule = await loadScheduleForCheckout(scheduleId, store._id);

  if (!isManagerOrAbove(user.role, storeRole)) {
    assertMemberAssigned(schedule, user._id);
  }

  const expected = await getExpectedTotalsForSchedule(store._id, schedule);

  const existing = await ShiftCheckout.findOne({
    schedule: schedule._id,
    member: user._id,
  });

  return {
    schedule: {
      _id: schedule._id,
      date: schedule.date,
      shiftTemplate: schedule.shiftTemplate,
    },
    ...expected,
    existingCheckout: existing,
  };
}

export async function submitShiftCheckout(
  scheduleId: string,
  store: StoreContext,
  user: AuthUser,
  body: { countedCash: number; countedBanking: number; notes?: string }
) {
  const schedule = await loadScheduleForCheckout(scheduleId, store._id);
  assertMemberAssigned(schedule, user._id);

  const existing = await ShiftCheckout.findOne({
    schedule: schedule._id,
    member: user._id,
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
    member: user._id,
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
  const checkouts = await ShiftCheckout.find({
    store: storeId,
    schedule: { $in: scheduleIds },
    member: memberId,
  });

  const checkoutBySchedule = new Map(
    checkouts.map((c) => [c.schedule.toString(), c])
  );

  const rows = await Promise.all(
    schedules.map(async (schedule) => {
      const checkout = checkoutBySchedule.get(schedule._id.toString());
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

  return rows;
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
