const express = require("express");
const { 
    getAllSchedules,
    getSchedulesByWeek,
    getSchedulesByDate,
    getSchedulesByDateRange,
    getSchedulesByMember,
    getScheduleById,
    createSchedule,
    bulkCreateSchedules,
    updateSchedule,
    deleteSchedule,
    assignMemberToShift,
    unassignMemberFromShift,
    updateMemberStatus,
    getMySchedules
} = require("../controllers/scheduleController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

const router = express.Router();

// Member routes - view own schedules (MUST come before admin routes with params)
router.route("/my-schedule")
    .get(isVerifiedUser, getMySchedules);

// View routes - All authenticated users can view schedules
router.route("/week/:year/:week")
    .get(isVerifiedUser, getSchedulesByWeek);

router.route("/date/:date")
    .get(isVerifiedUser, getSchedulesByDate);

router.route("/range")
    .get(isVerifiedUser, getSchedulesByDateRange);

router.route("/member/:memberId")
    .get(isVerifiedUser, getSchedulesByMember);

// Admin routes - Only admins can create/modify schedules
router.route("/")
    .get(isVerifiedUser, getAllSchedules)
    .post(isVerifiedUser, isAdmin, createSchedule);

router.route("/bulk")
    .post(isVerifiedUser, isAdmin, bulkCreateSchedules);

router.route("/:id")
    .get(isVerifiedUser, getScheduleById)
    .put(isVerifiedUser, isAdmin, updateSchedule)
    .delete(isVerifiedUser, isAdmin, deleteSchedule);

router.route("/:id/assign")
    .patch(isVerifiedUser, isAdmin, assignMemberToShift);

router.route("/:id/unassign")
    .patch(isVerifiedUser, isAdmin, unassignMemberFromShift);

router.route("/:id/status")
    .patch(isVerifiedUser, isAdmin, updateMemberStatus);

module.exports = router;

