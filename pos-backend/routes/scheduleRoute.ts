import express from "express";
import { getAllSchedules, getSchedulesByWeek, getSchedulesByDate, getSchedulesByDateRange, getSchedulesByMember, getScheduleById, createSchedule, bulkCreateSchedules, updateSchedule, deleteSchedule, assignMemberToShift, batchAssignMembers, unassignMemberFromShift, updateMemberStatus, getMySchedules, getMySchedulesAllStores, getAllMembersWeek, checkConflicts } from "../controllers/scheduleController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

// ── Cross-store routes (no store context needed) ─────────────────────────

// Member: own schedule across ALL stores
router.route("/my-schedule-all")
    .get(isVerifiedUser, getMySchedulesAllStores);

// Admin: all members across all stores for a given week
router.route("/all-members-week/:year/:week")
    .get(isVerifiedUser, isAdmin, getAllMembersWeek);

// Admin: check conflicts before assigning
router.route("/check-conflicts")
    .post(isVerifiedUser, isAdmin, checkConflicts);

// ── Store-scoped routes ──────────────────────────────────────────────────

router.route("/my-schedule")
    .get(isVerifiedUser, storeContext, getMySchedules);

router.route("/week/:year/:week")
    .get(isVerifiedUser, storeContext, getSchedulesByWeek);

router.route("/date/:date")
    .get(isVerifiedUser, storeContext, getSchedulesByDate);

router.route("/range")
    .get(isVerifiedUser, storeContext, getSchedulesByDateRange);

router.route("/member/:memberId")
    .get(isVerifiedUser, storeContext, getSchedulesByMember);

router.route("/")
    .get(isVerifiedUser, storeContext, getAllSchedules)
    .post(isVerifiedUser, storeContext, isAdmin, createSchedule);

router.route("/bulk")
    .post(isVerifiedUser, storeContext, isAdmin, bulkCreateSchedules);

router.route("/:id")
    .get(isVerifiedUser, storeContext, getScheduleById)
    .put(isVerifiedUser, storeContext, isAdmin, updateSchedule)
    .delete(isVerifiedUser, storeContext, isAdmin, deleteSchedule);

router.route("/:id/assign")
    .patch(isVerifiedUser, storeContext, isAdmin, assignMemberToShift);

router.route("/:id/batch-assign")
    .patch(isVerifiedUser, storeContext, isAdmin, batchAssignMembers);

router.route("/:id/unassign")
    .patch(isVerifiedUser, storeContext, isAdmin, unassignMemberFromShift);

router.route("/:id/status")
    .patch(isVerifiedUser, storeContext, isAdmin, updateMemberStatus);

export default router;