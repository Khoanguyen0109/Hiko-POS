// @ts-nocheck
import createHttpError from "http-errors";
import type { Types } from "mongoose";
import ShiftCheckIn from "../models/shiftCheckInModel.js";
import Schedule from "../models/scheduleModel.js";
import { getCurrentVietnamTime } from "../utils/dateUtils.js";
import {
  loadScheduleForCheckout,
  resolveCheckoutMemberId,
} from "../utils/shiftSessionUtils.js";

export async function submitShiftCheckIn(
  scheduleId: string,
  storeId: Types.ObjectId,
  user: { _id: Types.ObjectId; role: string },
  body: { openingCash: number; notes?: string; memberId?: string },
  storeRole?: string
) {
  const schedule = await loadScheduleForCheckout(scheduleId, storeId);
  const targetMemberId = resolveCheckoutMemberId(
    schedule,
    user,
    storeRole,
    body.memberId
  );

  const existing = await ShiftCheckIn.findOne({
    schedule: schedule._id,
    member: targetMemberId,
  });
  if (existing) {
    throw createHttpError(409, "Already checked in for this shift");
  }

  const openingCash = Number(body.openingCash);
  if (Number.isNaN(openingCash) || openingCash < 0) {
    throw createHttpError(400, "Opening cash must be a non-negative number");
  }

  const checkedInAt = getCurrentVietnamTime();

  const checkIn = await ShiftCheckIn.create({
    store: storeId,
    schedule: schedule._id,
    member: targetMemberId,
    shiftDate: schedule.date,
    shiftTemplate: schedule.shiftTemplate._id,
    openingCash,
    notes: (body.notes || "").trim(),
    checkedInAt,
  });

  await Schedule.updateOne(
    { _id: schedule._id, "assignedMembers.member": targetMemberId },
    { $set: { "assignedMembers.$.clockIn": checkedInAt } }
  );

  await checkIn.populate([
    { path: "member", select: "name email" },
    { path: "shiftTemplate", select: "name shortName startTime endTime color" },
    { path: "schedule", select: "date" },
  ]);

  return checkIn;
}

function toIdString(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && ref._id != null) {
    return String(ref._id);
  }
  return String(ref);
}

export function attachCheckInsToShiftRows(rows, checkIns) {
  const map = new Map(
    checkIns.map((ci) => [
      `${toIdString(ci.schedule)}:${toIdString(ci.member)}`,
      ci,
    ])
  );

  return rows.map((row) => {
    const key = `${toIdString(row.schedule?._id)}:${toIdString(row.member?._id)}`;
    const checkIn = map.get(key) || null;
    return {
      ...row,
      checkIn,
      checkInStatus: checkIn ? "checked_in" : "not_checked_in",
    };
  });
}

export async function loadCheckInsForSchedules(
  storeId: Types.ObjectId,
  scheduleIds: Types.ObjectId[]
) {
  if (!scheduleIds.length) return [];
  return ShiftCheckIn.find({
    store: storeId,
    schedule: { $in: scheduleIds },
  })
    .populate("member", "name email")
    .lean();
}
