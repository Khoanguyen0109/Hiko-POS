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

// Admin routes
router.route("/")
    .get(isVerifiedUser, isAdmin, getAllSchedules)
    .post(isVerifiedUser, isAdmin, createSchedule);

router.route("/bulk")
    .post(isVerifiedUser, isAdmin, bulkCreateSchedules);

router.route("/range")
    .get(isVerifiedUser, isAdmin, getSchedulesByDateRange);

router.route("/week/:year/:week")
    .get(isVerifiedUser, isAdmin, getSchedulesByWeek);

router.route("/date/:date")
    .get(isVerifiedUser, isAdmin, getSchedulesByDate);

router.route("/member/:memberId")
    .get(isVerifiedUser, isAdmin, getSchedulesByMember);

router.route("/:id")
    .get(isVerifiedUser, isAdmin, getScheduleById)
    .put(isVerifiedUser, isAdmin, updateSchedule)
    .delete(isVerifiedUser, isAdmin, deleteSchedule);

router.route("/:id/assign")
    .patch(isVerifiedUser, isAdmin, assignMemberToShift);

router.route("/:id/unassign")
    .patch(isVerifiedUser, isAdmin, unassignMemberFromShift);

router.route("/:id/status")
    .patch(isVerifiedUser, isAdmin, updateMemberStatus);

module.exports = router;

