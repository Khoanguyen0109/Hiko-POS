import express from "express";
import { getAllSchedules, getSchedulesByWeek, getSchedulesByDate, getSchedulesByDateRange, getSchedulesByMember, getScheduleById, createSchedule, bulkCreateSchedules, updateSchedule, deleteSchedule, assignMemberToShift, batchAssignMembers, unassignMemberFromShift, updateMemberStatus, getMySchedules, getMySchedulesAllStores, getAllMembersWeek, checkConflicts } from "../controllers/scheduleController.js";
import { isVerifiedUser, canManageStore, isAdminOrStoreManager } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

const router = express.Router();

// ── Cross-store routes (no store context needed) ─────────────────────────

// Member: own schedule across ALL stores
router.route("/my-schedule-all")
    .get(isVerifiedUser, getMySchedulesAllStores);

// All authenticated users: every store's schedules for a given week (view-only for members)
router.route("/all-members-week/:year/:week")
    .get(isVerifiedUser, getAllMembersWeek);

// Admin: check conflicts before assigning
router.route("/check-conflicts")
    .post(isVerifiedUser, isAdminOrStoreManager, checkConflicts);

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
    .post(isVerifiedUser, storeContext, canManageStore, createSchedule);

router.route("/bulk")
    .post(isVerifiedUser, storeContext, canManageStore, bulkCreateSchedules);

router.route("/:id")
    .get(isVerifiedUser, storeContext, getScheduleById)
    .put(isVerifiedUser, storeContext, canManageStore, updateSchedule)
    .delete(isVerifiedUser, storeContext, canManageStore, deleteSchedule);

router.route("/:id/assign")
    .patch(isVerifiedUser, storeContext, canManageStore, assignMemberToShift);

router.route("/:id/batch-assign")
    .patch(isVerifiedUser, storeContext, canManageStore, batchAssignMembers);

router.route("/:id/unassign")
    .patch(isVerifiedUser, storeContext, canManageStore, unassignMemberFromShift);

router.route("/:id/status")
    .patch(isVerifiedUser, storeContext, canManageStore, updateMemberStatus);

export default router;