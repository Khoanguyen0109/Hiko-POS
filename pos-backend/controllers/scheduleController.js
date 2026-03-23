const createHttpError = require("http-errors");
const Schedule = require("../models/scheduleModel");
const ShiftTemplate = require("../models/shiftTemplateModel");
const StoreUser = require("../models/storeUserModel");
const User = require("../models/userModel");
const { getISOWeek } = require("../utils/dateUtils");

// ── helpers ──────────────────────────────────────────────────────────────

const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

const timeRangesOverlap = (s1, e1, s2, e2) => {
    const a = timeToMinutes(s1), b = timeToMinutes(e1);
    const c = timeToMinutes(s2), d = timeToMinutes(e2);
    return a < d && c < b;
};

/**
 * Returns an array of conflict objects for a set of member IDs on a given date.
 * Each conflict: { memberId, memberName, conflictStore, conflictShift, conflictTime }
 * Excludes the schedule identified by `excludeScheduleId` (the one being edited).
 */
const findConflictsForDate = async (memberIds, date, shiftTemplate, excludeScheduleId = null) => {
    if (!memberIds || memberIds.length === 0) return [];

    const memberIdsSet = new Set(
        memberIds
            .filter((m) => m != null)
            .map((m) => (typeof m === "string" ? m : m.toString()).trim())
    );
    const memberIdsArr = [...memberIdsSet];
    if (memberIdsArr.length === 0) return [];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
        date: { $gte: startOfDay, $lte: endOfDay },
        "assignedMembers.member": { $in: memberIdsArr }
    };
    if (excludeScheduleId) {
        query._id = { $ne: excludeScheduleId };
    }

    const existing = await Schedule.find(query)
        .populate('shiftTemplate', 'name startTime endTime')
        .populate('store', 'name code')
        .populate('assignedMembers.member', 'name');

    const conflicts = [];

    for (const sched of existing) {
        if (!sched.shiftTemplate) continue;
        const overlap = timeRangesOverlap(
            shiftTemplate.startTime, shiftTemplate.endTime,
            sched.shiftTemplate.startTime, sched.shiftTemplate.endTime
        );
        if (!overlap) continue;

        for (const am of sched.assignedMembers) {
            const mid = am.member?._id?.toString() || am.member?.toString();
            if (mid && memberIdsSet.has(mid)) {
                conflicts.push({
                    memberId: mid,
                    memberName: am.member?.name || 'Unknown',
                    conflictStore: sched.store?.name || 'Unknown store',
                    conflictStoreId: sched.store?._id,
                    conflictShift: sched.shiftTemplate.name,
                    conflictTime: `${sched.shiftTemplate.startTime}-${sched.shiftTemplate.endTime}`
                });
            }
        }
    }

    return conflicts;
};

// ── parse date helper ────────────────────────────────────────────────────

const parseDate = (dateString) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return new Date(year, month - 1, day);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        return new Date(year, month - 1, day);
    }
    return new Date(dateString);
};

// ── CRUD ─────────────────────────────────────────────────────────────────

const getAllSchedules = async (req, res, next) => {
    try {
        const { memberId, startDate, endDate, shiftTemplateId } = req.query;
        const query = { store: req.store._id };

        if (memberId) query["assignedMembers.member"] = memberId;
        if (shiftTemplateId) query.shiftTemplate = shiftTemplateId;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const schedules = await Schedule.find(query)
            .populate('shiftTemplate')
            .populate('assignedMembers.member', '-password')
            .populate('createdBy', 'name email')
            .sort({ date: 1, 'shiftTemplate.startTime': 1 });

        res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        next(error);
    }
};

const getSchedulesByWeek = async (req, res, next) => {
    try {
        const { year, week } = req.params;
        if (!year || !week) {
            return next(createHttpError(400, "Year and week number are required"));
        }

        const schedules = await Schedule.find({
            store: req.store._id,
            year: parseInt(year),
            weekNumber: parseInt(week)
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', '-password')
        .populate('createdBy', 'name email')
        .sort({ date: 1 });

        res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        next(error);
    }
};

const getSchedulesByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        if (!date) return next(createHttpError(400, "Date is required"));

        const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

        const schedules = await Schedule.find({
            store: req.store._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', '-password')
        .sort({ 'shiftTemplate.startTime': 1 });

        res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        next(error);
    }
};

const getSchedulesByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return next(createHttpError(400, "Start date and end date are required"));
        }

        const schedules = await Schedule.find({
            store: req.store._id,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', '-password')
        .populate('createdBy', 'name email')
        .sort({ date: 1, 'shiftTemplate.startTime': 1 });

        res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        next(error);
    }
};

const getSchedulesByMember = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const { startDate, endDate } = req.query;
        if (!memberId) return next(createHttpError(400, "Member ID is required"));

        const query = {
            store: req.store._id,
            "assignedMembers.member": memberId
        };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const schedules = await Schedule.find(query)
            .populate('shiftTemplate')
            .populate('assignedMembers.member', '-password')
            .sort({ date: 1 });

        res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        next(error);
    }
};

const getScheduleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) return next(createHttpError(400, "Schedule ID is required"));

        const schedule = await Schedule.findOne({ _id: id, store: req.store._id })
            .populate('shiftTemplate')
            .populate('assignedMembers.member', '-password')
            .populate('createdBy', 'name email')
            .populate('lastModifiedBy', 'name email');

        if (!schedule) return next(createHttpError(404, "Schedule not found"));
        res.status(200).json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

const createSchedule = async (req, res, next) => {
    try {
        const { date, shiftTemplateId, memberIds, notes, year, weekNumber } = req.body;

        if (!date || !shiftTemplateId) {
            return next(createHttpError(400, "Date and shift template are required"));
        }

        const scheduleDate = parseDate(date);
        if (isNaN(scheduleDate.getTime())) {
            return next(createHttpError(400, "Invalid date format. Use YYYY-MM-DD"));
        }
        scheduleDate.setHours(0, 0, 0, 0);

        const shiftTemplate = await ShiftTemplate.findById(shiftTemplateId);
        if (!shiftTemplate) return next(createHttpError(404, "Shift template not found"));
        if (!shiftTemplate.isActive) {
            return next(createHttpError(400, "Cannot create schedule with inactive shift template"));
        }

        const startOfDay = new Date(scheduleDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(scheduleDate); endOfDay.setHours(23, 59, 59, 999);

        const existingSchedule = await Schedule.findOne({
            store: req.store._id,
            date: { $gte: startOfDay, $lte: endOfDay },
            shiftTemplate: shiftTemplateId
        });

        if (existingSchedule) {
            await existingSchedule.populate([
                { path: 'shiftTemplate' },
                { path: 'assignedMembers.member', select: '-password' },
                { path: 'createdBy', select: 'name email' }
            ]);
            return res.status(200).json({
                success: true,
                message: "Schedule already exists, returning existing schedule",
                data: existingSchedule,
                existed: true
            });
        }

        // Conflict check for initial member list
        const assignedMembers = [];
        if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
            const conflicts = await findConflictsForDate(memberIds, scheduleDate, shiftTemplate);
            if (conflicts.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Schedule conflict detected",
                    conflicts
                });
            }

            for (const memberId of memberIds) {
                const member = await User.findById(memberId);
                if (member && member.isActive) {
                    assignedMembers.push({ member: memberId, status: "scheduled" });
                }
            }
        }

        let scheduleYear = year;
        let scheduleWeekNumber = weekNumber;
        if (!scheduleYear || !scheduleWeekNumber) {
            const iso = getISOWeek(scheduleDate);
            scheduleYear = iso.year;
            scheduleWeekNumber = iso.weekNumber;
        }

        const schedule = new Schedule({
            store: req.store._id,
            date: scheduleDate,
            shiftTemplate: shiftTemplateId,
            assignedMembers,
            notes: notes || "",
            year: scheduleYear,
            weekNumber: scheduleWeekNumber,
            createdBy: req.user._id
        });

        await schedule.save();
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' },
            { path: 'createdBy', select: 'name email' }
        ]);

        res.status(201).json({ success: true, message: "Schedule created successfully", data: schedule });
    } catch (error) {
        next(error);
    }
};

const bulkCreateSchedules = async (req, res, next) => {
    try {
        const { schedules } = req.body;
        if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
            return next(createHttpError(400, "Schedules array is required"));
        }

        const createdSchedules = [];
        const errors = [];

        for (const scheduleData of schedules) {
            try {
                const { date, shiftTemplateId, memberIds, notes } = scheduleData;
                if (!date || !shiftTemplateId) {
                    errors.push({ date, shiftTemplateId, error: "Date and shift template are required" });
                    continue;
                }

                const shiftTemplate = await ShiftTemplate.findById(shiftTemplateId);
                if (!shiftTemplate || !shiftTemplate.isActive) {
                    errors.push({ date, shiftTemplateId, error: "Invalid or inactive shift template" });
                    continue;
                }

                const scheduleDate = parseDate(date);
                if (isNaN(scheduleDate.getTime())) {
                    errors.push({ date, shiftTemplateId, error: "Invalid date format. Use YYYY-MM-DD" });
                    continue;
                }
                scheduleDate.setHours(0, 0, 0, 0);

                const existing = await Schedule.findOne({
                    store: req.store._id,
                    date: scheduleDate,
                    shiftTemplate: shiftTemplateId
                });
                if (existing) {
                    errors.push({ date, shiftTemplateId, error: "Schedule already exists" });
                    continue;
                }

                if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
                    const conflicts = await findConflictsForDate(memberIds, scheduleDate, shiftTemplate);
                    if (conflicts.length > 0) {
                        errors.push({ date, shiftTemplateId, error: "Schedule conflict detected", conflicts });
                        continue;
                    }
                }

                const assignedMembers = [];
                if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
                    for (const memberId of memberIds) {
                        const member = await User.findById(memberId);
                        if (member && member.isActive) {
                            assignedMembers.push({ member: memberId, status: "scheduled" });
                        }
                    }
                }

                const schedule = new Schedule({
                    store: req.store._id,
                    date: scheduleDate,
                    shiftTemplate: shiftTemplateId,
                    assignedMembers,
                    notes: notes || "",
                    createdBy: req.user._id
                });

                await schedule.save();
                await schedule.populate([
                    { path: 'shiftTemplate' },
                    { path: 'assignedMembers.member', select: '-password' }
                ]);
                createdSchedules.push(schedule);
            } catch (err) {
                errors.push({ date: scheduleData.date, error: err.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `${createdSchedules.length} schedules created successfully`,
            count: createdSchedules.length,
            data: createdSchedules,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        next(error);
    }
};

const updateSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date, shiftTemplateId, notes } = req.body;
        if (!id) return next(createHttpError(400, "Schedule ID is required"));

        const schedule = await Schedule.findOne({ _id: id, store: req.store._id });
        if (!schedule) return next(createHttpError(404, "Schedule not found"));

        if (date) {
            const scheduleDate = new Date(date);
            scheduleDate.setHours(0, 0, 0, 0);
            schedule.date = scheduleDate;
        }
        if (shiftTemplateId) {
            const st = await ShiftTemplate.findById(shiftTemplateId);
            if (!st) return next(createHttpError(404, "Shift template not found"));
            schedule.shiftTemplate = shiftTemplateId;
        }
        if (notes !== undefined) schedule.notes = notes;

        schedule.lastModifiedBy = req.user._id;
        await schedule.save();
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' },
            { path: 'lastModifiedBy', select: 'name email' }
        ]);

        res.status(200).json({ success: true, message: "Schedule updated successfully", data: schedule });
    } catch (error) {
        next(error);
    }
};

const deleteSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) return next(createHttpError(400, "Schedule ID is required"));

        const schedule = await Schedule.findOneAndDelete({ _id: id, store: req.store._id });
        if (!schedule) return next(createHttpError(404, "Schedule not found"));

        res.status(200).json({ success: true, message: "Schedule deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// ── assignment with conflict detection ───────────────────────────────────

const assignMemberToShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberId } = req.body;
        if (!id || !memberId) {
            return next(createHttpError(400, "Schedule ID and Member ID are required"));
        }

        const schedule = await Schedule.findOne({ _id: id, store: req.store._id })
            .populate('shiftTemplate');
        if (!schedule) return next(createHttpError(404, "Schedule not found"));

        const member = await User.findById(memberId);
        if (!member) return next(createHttpError(404, "Member not found"));
        if (!member.isActive) return next(createHttpError(400, "Cannot assign inactive member"));

        const alreadyAssigned = schedule.assignedMembers.some(
            am => am.member.toString() === memberId
        );
        if (alreadyAssigned) {
            return next(createHttpError(400, "Member already assigned to this shift"));
        }

        // Cross-store conflict check
        const conflicts = await findConflictsForDate(
            [memberId], schedule.date, schedule.shiftTemplate, schedule._id
        );
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: `${member.name} has a conflicting shift at ${conflicts[0].conflictStore} (${conflicts[0].conflictTime})`,
                conflicts
            });
        }

        schedule.assignedMembers.push({ member: memberId, status: "scheduled" });
        schedule.lastModifiedBy = req.user._id;
        await schedule.save();
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' }
        ]);

        res.status(200).json({ success: true, message: "Member assigned successfully", data: schedule });
    } catch (error) {
        next(error);
    }
};

const batchAssignMembers = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberIds } = req.body;
        if (!id) return next(createHttpError(400, "Schedule ID is required"));
        if (!Array.isArray(memberIds)) {
            return next(createHttpError(400, "memberIds must be an array"));
        }

        const schedule = await Schedule.findOne({ _id: id, store: req.store._id })
            .populate('shiftTemplate');
        if (!schedule) return next(createHttpError(404, "Schedule not found"));

        // Determine newly-added members (not previously assigned)
        const previousIds = schedule.assignedMembers.map(am => am.member.toString());
        const newMemberIds = memberIds.filter(mid => !previousIds.includes(mid));

        // Cross-store conflict check for newly added members
        if (newMemberIds.length > 0) {
            const conflicts = await findConflictsForDate(
                newMemberIds, schedule.date, schedule.shiftTemplate, schedule._id
            );
            if (conflicts.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Schedule conflict detected for one or more members",
                    conflicts
                });
            }
        }

        const assignedMembers = [];
        for (const memberId of memberIds) {
            const member = await User.findById(memberId);
            if (!member) return next(createHttpError(404, `Member ${memberId} not found`));
            if (!member.isActive) return next(createHttpError(400, `Member ${member.name} is inactive`));

            const existing = schedule.assignedMembers.find(
                am => am.member.toString() === memberId
            );
            assignedMembers.push({
                member: memberId,
                status: existing ? existing.status : "scheduled"
            });
        }

        schedule.assignedMembers = assignedMembers;
        schedule.lastModifiedBy = req.user._id;
        await schedule.save();
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' }
        ]);

        res.status(200).json({ success: true, message: "Members assigned successfully", data: schedule });
    } catch (error) {
        next(error);
    }
};

const unassignMemberFromShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberId } = req.body;
        if (!id || !memberId) {
            return next(createHttpError(400, "Schedule ID and Member ID are required"));
        }

        const schedule = await Schedule.findOne({ _id: id, store: req.store._id });
        if (!schedule) return next(createHttpError(404, "Schedule not found"));

        schedule.assignedMembers = schedule.assignedMembers.filter(
            am => am.member.toString() !== memberId
        );
        schedule.lastModifiedBy = req.user._id;
        await schedule.save();
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' }
        ]);

        res.status(200).json({ success: true, message: "Member unassigned successfully", data: schedule });
    } catch (error) {
        next(error);
    }
};

const updateMemberStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberId, status } = req.body;
        if (!id || !memberId || !status) {
            return next(createHttpError(400, "Schedule ID, Member ID, and status are required"));
        }

        const validStatuses = ["scheduled", "confirmed", "completed", "absent", "cancelled"];
        if (!validStatuses.includes(status)) {
            return next(createHttpError(400, "Invalid status"));
        }

        const schedule = await Schedule.findOne({ _id: id, store: req.store._id });
        if (!schedule) return next(createHttpError(404, "Schedule not found"));

        const am = schedule.assignedMembers.find(a => a.member.toString() === memberId);
        if (!am) return next(createHttpError(404, "Member not assigned to this shift"));

        am.status = status;
        schedule.lastModifiedBy = req.user._id;
        await schedule.save();
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' }
        ]);

        res.status(200).json({ success: true, message: "Member status updated successfully", data: schedule });
    } catch (error) {
        next(error);
    }
};

// ── my schedule (current store) ──────────────────────────────────────────

const getMySchedules = async (req, res, next) => {
    try {
        const memberId = req.user._id;
        const { startDate, endDate } = req.query;

        const query = {
            store: req.store._id,
            "assignedMembers.member": memberId
        };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const schedules = await Schedule.find(query)
            .populate('shiftTemplate')
            .populate('assignedMembers.member', 'name email phone')
            .sort({ date: 1 });

        res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        next(error);
    }
};

// ── cross-store: my schedule (all stores) ────────────────────────────────

const getMySchedulesAllStores = async (req, res, next) => {
    try {
        const memberId = req.user._id;
        const { startDate, endDate, year, week } = req.query;

        const query = { "assignedMembers.member": memberId };

        if (year && week) {
            query.year = parseInt(year);
            query.weekNumber = parseInt(week);
        } else if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const schedules = await Schedule.find(query)
            .populate('shiftTemplate')
            .populate('store', 'name code')
            .populate('assignedMembers.member', 'name email phone')
            .sort({ date: 1 });

        res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        next(error);
    }
};

// ── admin: all members week (cross-store) ────────────────────────────────

const getAllMembersWeek = async (req, res, next) => {
    try {
        const { year, week } = req.params;
        if (!year || !week) {
            return next(createHttpError(400, "Year and week are required"));
        }

        const schedules = await Schedule.find({
            year: parseInt(year),
            weekNumber: parseInt(week)
        })
        .populate('shiftTemplate')
        .populate('store', 'name code')
        .populate('assignedMembers.member', 'name email phone')
        .sort({ date: 1 });

        res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        next(error);
    }
};

// ── conflict check endpoint (for frontend preview) ──────────────────────

const checkConflicts = async (req, res, next) => {
    try {
        const { memberIds, date, shiftTemplateId, excludeScheduleId } = req.body;

        if (!memberIds || !date || !shiftTemplateId) {
            return next(createHttpError(400, "memberIds, date, and shiftTemplateId are required"));
        }

        const shiftTemplate = await ShiftTemplate.findById(shiftTemplateId);
        if (!shiftTemplate) return next(createHttpError(404, "Shift template not found"));

        const scheduleDate = parseDate(date);
        const conflicts = await findConflictsForDate(
            memberIds, scheduleDate, shiftTemplate, excludeScheduleId || null
        );

        res.status(200).json({ success: true, data: conflicts });
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
    batchAssignMembers,
    unassignMemberFromShift,
    updateMemberStatus,
    getMySchedules,
    getMySchedulesAllStores,
    getAllMembersWeek,
    checkConflicts
};
