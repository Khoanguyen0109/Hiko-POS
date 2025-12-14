const createHttpError = require("http-errors");
const Schedule = require("../models/scheduleModel");
const ShiftTemplate = require("../models/shiftTemplateModel");
const User = require("../models/userModel");

// Get all schedules (with filters)
const getAllSchedules = async (req, res, next) => {
    try {
        const { memberId, startDate, endDate, shiftTemplateId } = req.query;
        
        const query = {};
        
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
        
        res.status(200).json({
            success: true,
            count: schedules.length,
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

// Get schedules by week
const getSchedulesByWeek = async (req, res, next) => {
    try {
        const { year, week } = req.params;
        
        if (!year || !week) {
            return next(createHttpError(400, "Year and week number are required"));
        }
        
        const schedules = await Schedule.find({
            year: parseInt(year),
            weekNumber: parseInt(week)
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', '-password')
        .populate('createdBy', 'name email')
        .sort({ date: 1 });
        
        // Debug logging to check populated data
        console.log('📅 Week Schedules Found:', schedules.length);
        if (schedules.length > 0) {
            console.log('📋 Sample Schedule:', {
                id: schedules[0]._id,
                date: schedules[0].date,
                assignedMembers: schedules[0].assignedMembers,
                assignedMembersCount: schedules[0].assignedMembers.length
            });
        }
        
        res.status(200).json({
            success: true,
            count: schedules.length,
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

// Get schedules by date
const getSchedulesByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        
        if (!date) {
            return next(createHttpError(400, "Date is required"));
        }
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const schedules = await Schedule.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', '-password')
        .sort({ 'shiftTemplate.startTime': 1 });
        
        res.status(200).json({
            success: true,
            count: schedules.length,
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

// Get schedules by date range
const getSchedulesByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return next(createHttpError(400, "Start date and end date are required"));
        }
        
        const schedules = await Schedule.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', '-password')
        .populate('createdBy', 'name email')
        .sort({ date: 1, 'shiftTemplate.startTime': 1 });
        
        res.status(200).json({
            success: true,
            count: schedules.length,
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

// Get schedules by member
const getSchedulesByMember = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const { startDate, endDate } = req.query;
        
        if (!memberId) {
            return next(createHttpError(400, "Member ID is required"));
        }
        
        const query = {
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
        
        res.status(200).json({
            success: true,
            count: schedules.length,
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

// Get schedule by ID
const getScheduleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return next(createHttpError(400, "Schedule ID is required"));
        }
        
        const schedule = await Schedule.findById(id)
            .populate('shiftTemplate')
            .populate('assignedMembers.member', '-password')
            .populate('createdBy', 'name email')
            .populate('lastModifiedBy', 'name email');
        
        if (!schedule) {
            return next(createHttpError(404, "Schedule not found"));
        }
        
        res.status(200).json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to parse date in multiple formats
// NOTE: ISO format (YYYY-MM-DD) is STRONGLY RECOMMENDED for all requests
const parseDate = (dateString) => {
    // Try ISO format first (YYYY-MM-DD) - RECOMMENDED
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return new Date(year, month - 1, day); // month is 0-indexed in JavaScript
    }
    
    // Try DD/MM/YYYY format (European format - for backward compatibility)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        // Assume DD/MM/YYYY if day > 12 or seems like European format
        if (parseInt(day) > 12) {
            return new Date(year, month - 1, day);
        }
        // Otherwise ambiguous - log warning
        console.warn(`⚠️  Ambiguous date format: ${dateString}. Please use ISO format (YYYY-MM-DD)`);
        return new Date(year, month - 1, day); // Assume DD/MM/YYYY
    }
    
    // Fallback to default Date parsing (not recommended)
    console.warn(`⚠️  Non-standard date format: ${dateString}. Please use ISO format (YYYY-MM-DD)`);
    return new Date(dateString);
};

// Create single schedule
const createSchedule = async (req, res, next) => {
    try {
        const { date, shiftTemplateId, memberIds, notes, year, weekNumber } = req.body;
        
        if (!date || !shiftTemplateId) {
            return next(createHttpError(400, "Date and shift template are required"));
        }
        
        // Parse date with support for multiple formats
        const scheduleDate = parseDate(date);
        
        // Validate date
        if (isNaN(scheduleDate.getTime())) {
            return next(createHttpError(400, "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY"));
        }
        
        scheduleDate.setHours(0, 0, 0, 0);
        
        // Verify shift template exists
        const shiftTemplate = await ShiftTemplate.findById(shiftTemplateId);
        if (!shiftTemplate) {
            return next(createHttpError(404, "Shift template not found"));
        }
        
        if (!shiftTemplate.isActive) {
            return next(createHttpError(400, "Cannot create schedule with inactive shift template"));
        }
        
        // Check if schedule already exists for this date and shift
        
        // Create date range for finding existing schedules (to handle timezone issues)
        const startOfDay = new Date(scheduleDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(scheduleDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingSchedule = await Schedule.findOne({
            date: { $gte: startOfDay, $lte: endOfDay },
            shiftTemplate: shiftTemplateId
        });
        
        if (existingSchedule) {
            // Return existing schedule instead of error
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
        
        // Prepare assigned members
        const assignedMembers = [];
        if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
            for (const memberId of memberIds) {
                const member = await User.findById(memberId);
                if (member && member.isActive) {
                    assignedMembers.push({
                        member: memberId,
                        status: "scheduled"
                    });
                }
            }
        }
        
        // Calculate year and weekNumber if not provided
        let scheduleYear = year;
        let scheduleWeekNumber = weekNumber;
        
        if (!scheduleYear || !scheduleWeekNumber) {
            scheduleYear = scheduleDate.getFullYear();
            
            // Calculate ISO week number
            const firstDayOfYear = new Date(scheduleDate.getFullYear(), 0, 1);
            const pastDaysOfYear = (scheduleDate - firstDayOfYear) / 86400000;
            scheduleWeekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        }
        
        const schedule = new Schedule({
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
        
        res.status(201).json({
            success: true,
            message: "Schedule created successfully",
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Bulk create schedules
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
                    errors.push({
                        date,
                        shiftTemplateId,
                        error: "Date and shift template are required"
                    });
                    continue;
                }
                
                // Verify shift template exists
                const shiftTemplate = await ShiftTemplate.findById(shiftTemplateId);
                if (!shiftTemplate || !shiftTemplate.isActive) {
                    errors.push({
                        date,
                        shiftTemplateId,
                        error: "Invalid or inactive shift template"
                    });
                    continue;
                }
                
                // Check if schedule already exists
                const scheduleDate = new Date(date);
                scheduleDate.setHours(0, 0, 0, 0);
                
                const existingSchedule = await Schedule.findOne({
                    date: scheduleDate,
                    shiftTemplate: shiftTemplateId
                });
                
                if (existingSchedule) {
                    errors.push({
                        date,
                        shiftTemplateId,
                        error: "Schedule already exists"
                    });
                    continue;
                }
                
                const assignedMembers = [];
                if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
                    for (const memberId of memberIds) {
                        const member = await User.findById(memberId);
                        if (member && member.isActive) {
                            assignedMembers.push({
                                member: memberId,
                                status: "scheduled"
                            });
                        }
                    }
                }
                
                const schedule = new Schedule({
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
                errors.push({
                    date: scheduleData.date,
                    error: err.message
                });
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

// Update schedule
const updateSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date, shiftTemplateId, notes } = req.body;
        
        if (!id) {
            return next(createHttpError(400, "Schedule ID is required"));
        }
        
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return next(createHttpError(404, "Schedule not found"));
        }
        
        // Update fields
        if (date) {
            const scheduleDate = new Date(date);
            scheduleDate.setHours(0, 0, 0, 0);
            schedule.date = scheduleDate;
        }
        
        if (shiftTemplateId) {
            const shiftTemplate = await ShiftTemplate.findById(shiftTemplateId);
            if (!shiftTemplate) {
                return next(createHttpError(404, "Shift template not found"));
            }
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
        
        res.status(200).json({
            success: true,
            message: "Schedule updated successfully",
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Delete schedule
const deleteSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return next(createHttpError(400, "Schedule ID is required"));
        }
        
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return next(createHttpError(404, "Schedule not found"));
        }
        
        await Schedule.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Schedule deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Assign member to shift
const assignMemberToShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberId } = req.body;
        
        if (!id || !memberId) {
            return next(createHttpError(400, "Schedule ID and Member ID are required"));
        }
        
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return next(createHttpError(404, "Schedule not found"));
        }
        
        // Verify member exists and is active
        const member = await User.findById(memberId);
        if (!member) {
            return next(createHttpError(404, "Member not found"));
        }
        
        if (!member.isActive) {
            return next(createHttpError(400, "Cannot assign inactive member"));
        }
        
        // Check if member already assigned
        const alreadyAssigned = schedule.assignedMembers.some(
            am => am.member.toString() === memberId
        );
        
        if (alreadyAssigned) {
            return next(createHttpError(400, "Member already assigned to this shift"));
        }
        
        schedule.assignedMembers.push({
            member: memberId,
            status: "scheduled"
        });
        
        schedule.lastModifiedBy = req.user._id;
        await schedule.save();
        
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' }
        ]);
        
        res.status(200).json({
            success: true,
            message: "Member assigned successfully",
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Unassign member from shift
const unassignMemberFromShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberId } = req.body;
        
        if (!id || !memberId) {
            return next(createHttpError(400, "Schedule ID and Member ID are required"));
        }
        
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return next(createHttpError(404, "Schedule not found"));
        }
        
        schedule.assignedMembers = schedule.assignedMembers.filter(
            am => am.member.toString() !== memberId
        );
        
        schedule.lastModifiedBy = req.user._id;
        await schedule.save();
        
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' }
        ]);
        
        res.status(200).json({
            success: true,
            message: "Member unassigned successfully",
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Update member status in shift
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
        
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return next(createHttpError(404, "Schedule not found"));
        }
        
        const assignedMember = schedule.assignedMembers.find(
            am => am.member.toString() === memberId
        );
        
        if (!assignedMember) {
            return next(createHttpError(404, "Member not assigned to this shift"));
        }
        
        assignedMember.status = status;
        schedule.lastModifiedBy = req.user._id;
        await schedule.save();
        
        await schedule.populate([
            { path: 'shiftTemplate' },
            { path: 'assignedMembers.member', select: '-password' }
        ]);
        
        res.status(200).json({
            success: true,
            message: "Member status updated successfully",
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Get member's own schedules
const getMySchedules = async (req, res, next) => {
    try {
        const memberId = req.user._id;
        const { startDate, endDate } = req.query;
        
        const query = {
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
        
        res.status(200).json({
            success: true,
            count: schedules.length,
            data: schedules
        });
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
    unassignMemberFromShift,
    updateMemberStatus,
    getMySchedules
};

