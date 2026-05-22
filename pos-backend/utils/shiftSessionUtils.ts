// @ts-nocheck
import createHttpError from "http-errors";
import mongoose from "mongoose";
import type { Types } from "mongoose";
import Schedule from "../models/scheduleModel.js";

type StoreRole = "Owner" | "Manager" | "Staff";

interface AuthUser {
  _id: Types.ObjectId;
  role: string;
}

export function isManagerOrAbove(
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
  memberId: Types.ObjectId | string
) {
  const assigned = schedule.assignedMembers.some(
    (am) => am.member.toString() === memberId.toString()
  );
  if (!assigned) {
    throw createHttpError(403, "Selected member is not assigned to this shift");
  }
}

export function resolveCheckoutMemberId(
  schedule: {
    assignedMembers: { member: Types.ObjectId }[];
  },
  user: AuthUser,
  storeRole: string | undefined,
  memberIdParam?: string
): Types.ObjectId {
  if (isManagerOrAbove(user.role, storeRole)) {
    if (memberIdParam) {
      if (!mongoose.Types.ObjectId.isValid(memberIdParam)) {
        throw createHttpError(400, "Invalid memberId");
      }
      assertMemberAssigned(schedule, memberIdParam);
      return new mongoose.Types.ObjectId(memberIdParam);
    }
    if (schedule.assignedMembers.length === 1) {
      return schedule.assignedMembers[0].member;
    }
    throw createHttpError(
      400,
      "memberId is required when multiple staff are assigned to this shift"
    );
  }

  assertMemberAssigned(schedule, user._id);
  return user._id;
}
