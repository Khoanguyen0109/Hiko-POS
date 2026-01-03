const Schedule = require('../models/scheduleModel');
const User = require('../models/userModel');
const ExtraWork = require('../models/extraWorkModel');
const createHttpError = require('http-errors');
const { getDateRangeVietnam, getCurrentVietnamTime } = require('../utils/dateUtils');

/**
 * Get member's monthly salary based on assigned shifts
 * Only the logged-in member can view their own salary
 */
const getMonthlySalary = async (req, res, next) => {
    try {
        const { year, month } = req.params;
        const memberId = req.user._id; // Current logged-in user

        // Validate year and month
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
            const error = createHttpError(400, "Invalid year or month!");
            return next(error);
        }

        // Get member's hourly rate (salary field)
        const member = await User.findById(memberId).select('salary name role');
        if (!member) {
            const error = createHttpError(404, "Member not found!");
            return next(error);
        }

        const hourlyRate = member.salary || 0;

        // Calculate date range for the month
        const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59); // Last day of month

        // Find all schedules where this member is assigned
        const schedules = await Schedule.find({
            'assignedMembers.member': memberId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })
        .populate('shiftTemplate', 'name shortName startTime endTime durationHours color')
        .populate('assignedMembers.member', 'name')
        .sort({ date: 1 });

        // Calculate total hours and shifts
        let totalHours = 0;
        let totalShifts = 0;
        const shiftDetails = [];

        for (const schedule of schedules) {
            // Check if member is actually assigned to this schedule
            const memberAssignment = schedule.assignedMembers.find(
                am => am.member._id.toString() === memberId.toString()
            );

            if (memberAssignment && schedule.shiftTemplate) {
                const hours = schedule.shiftTemplate.durationHours || 0;
                totalHours += hours;
                totalShifts++;

                shiftDetails.push({
                    date: schedule.date,
                    shiftName: schedule.shiftTemplate.name,
                    startTime: schedule.shiftTemplate.startTime,
                    endTime: schedule.shiftTemplate.endTime,
                    hours: hours,
                    status: memberAssignment.status,
                    color: schedule.shiftTemplate.color
                });
            }
        }

        // Calculate total salary from regular shifts
        const regularSalary = totalHours * hourlyRate;

        // Fetch extra work entries for this member in the selected month
        const extraWorkEntries = await ExtraWork.find({
            member: memberId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })
        .sort({ date: 1 });

        // Calculate extra work totals
        let extraWorkHours = 0;
        let extraWorkPayment = 0;
        const extraWorkDetails = [];

        for (const entry of extraWorkEntries) {
            extraWorkHours += entry.durationHours || 0;
            extraWorkPayment += entry.paymentAmount || 0;
            
            extraWorkDetails.push({
                date: entry.date,
                durationHours: entry.durationHours,
                workType: entry.workType,
                description: entry.description,
                hourlyRate: entry.hourlyRate,
                paymentAmount: entry.paymentAmount,
                isApproved: entry.isApproved,
                isPaid: entry.isPaid
            });
        }

        // Calculate combined totals
        const combinedTotalHours = totalHours + extraWorkHours;
        const combinedTotalSalary = regularSalary + extraWorkPayment;

        res.status(200).json({
            success: true,
            data: {
                member: {
                    id: member._id,
                    name: member.name,
                    role: member.role,
                    hourlyRate: hourlyRate
                },
                period: {
                    year: yearNum,
                    month: monthNum,
                    monthName: new Date(yearNum, monthNum - 1).toLocaleString('en-US', { month: 'long' })
                },
                summary: {
                    totalShifts: totalShifts,
                    regularHours: Math.round(totalHours * 100) / 100,
                    extraWorkHours: Math.round(extraWorkHours * 100) / 100,
                    totalHours: Math.round(combinedTotalHours * 100) / 100,
                    hourlyRate: hourlyRate,
                    regularSalary: Math.round(regularSalary * 100) / 100,
                    extraWorkPayment: Math.round(extraWorkPayment * 100) / 100,
                    totalSalary: Math.round(combinedTotalSalary * 100) / 100
                },
                shifts: shiftDetails,
                extraWork: extraWorkDetails
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get salary summary for all members (Admin only)
 * Supports date range filtering via startDate/endDate or period (today, week, month)
 * Also supports legacy year/month parameters for backward compatibility
 */
const getAllMembersSalarySummary = async (req, res, next) => {
    try {
        const { startDate, endDate, period, year, month } = req.query;

        // Date range setup - prioritize startDate/endDate, then period, then year/month
        let start, end;
        
        if (startDate && endDate) {
            // Use explicit date range
            const dateRange = getDateRangeVietnam(startDate, endDate);
            start = dateRange.start;
            end = dateRange.end;
        } else if (period) {
            // Use period-based filtering
            const today = getCurrentVietnamTime();
            
            switch (period) {
                case 'today':
                    start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                    break;
                case 'week':
                    // Get start of current week (Monday)
                    const dayOfWeek = today.getDay();
                    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
                    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToMonday);
                    end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - daysToMonday), 23, 59, 59, 999);
                    break;
                case 'month':
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                default:
                    // Default to current month
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            }
        } else if (year && month) {
            // Legacy support: year and month parameters
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);

            if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
                const error = createHttpError(400, "Invalid year or month!");
                return next(error);
            }

            start = new Date(yearNum, monthNum - 1, 1); // First day of month
            end = new Date(yearNum, monthNum, 0, 23, 59, 59); // Last day of month
        } else {
            // Default to current month if no parameters provided
            const today = getCurrentVietnamTime();
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Validate date range
        if (!start || !end) {
            const error = createHttpError(400, "Invalid date range!");
            return next(error);
        }

        if (start > end) {
            const error = createHttpError(400, "Start date must be before end date!");
            return next(error);
        }

        // Get all members (excluding admins)
        const members = await User.find({ 
            role: { $ne: 'Admin' }
        }).select('_id name salary role isActive');

        const salarySummaries = [];

        for (const member of members) {
            const memberId = member._id;
            const hourlyRate = member.salary || 0;

            // Find all schedules where this member is assigned
            const schedules = await Schedule.find({
                'assignedMembers.member': memberId,
                date: {
                    $gte: start,
                    $lte: end
                }
            })
            .populate('shiftTemplate', 'durationHours')
            .sort({ date: 1 });

            // Calculate regular hours and shifts
            let totalHours = 0;
            let totalShifts = 0;

            for (const schedule of schedules) {
                const memberAssignment = schedule.assignedMembers.find(
                    am => am.member.toString() === memberId.toString()
                );

                if (memberAssignment && schedule.shiftTemplate) {
                    const hours = schedule.shiftTemplate.durationHours || 0;
                    totalHours += hours;
                    totalShifts++;
                }
            }

            // Calculate regular salary
            const regularSalary = totalHours * hourlyRate;

            // Fetch extra work entries
            const extraWorkEntries = await ExtraWork.find({
                member: memberId,
                date: {
                    $gte: start,
                    $lte: end
                }
            });

            // Calculate extra work totals
            let extraWorkHours = 0;
            let extraWorkPayment = 0;

            for (const entry of extraWorkEntries) {
                extraWorkHours += entry.durationHours || 0;
                extraWorkPayment += entry.paymentAmount || 0;
            }

            // Calculate combined totals
            const combinedTotalHours = totalHours + extraWorkHours;
            const combinedTotalSalary = regularSalary + extraWorkPayment;

            salarySummaries.push({
                member: {
                    id: member._id,
                    name: member.name,
                    role: member.role,
                    hourlyRate: hourlyRate
                },
                summary: {
                    totalShifts: totalShifts,
                    regularHours: Math.round(totalHours * 100) / 100,
                    extraWorkHours: Math.round(extraWorkHours * 100) / 100,
                    totalHours: Math.round(combinedTotalHours * 100) / 100,
                    hourlyRate: hourlyRate,
                    regularSalary: Math.round(regularSalary * 100) / 100,
                    extraWorkPayment: Math.round(extraWorkPayment * 100) / 100,
                    totalSalary: Math.round(combinedTotalSalary * 100) / 100
                }
            });
        }

        // Calculate overall totals
        const overallSummary = salarySummaries.reduce((acc, member) => {
            acc.totalMembers += 1;
            acc.totalRegularHours += member.summary.regularHours;
            acc.totalExtraWorkHours += member.summary.extraWorkHours;
            acc.totalHours += member.summary.totalHours;
            acc.totalRegularSalary += member.summary.regularSalary;
            acc.totalExtraWorkPayment += member.summary.extraWorkPayment;
            acc.totalSalary += member.summary.totalSalary;
            return acc;
        }, {
            totalMembers: 0,
            totalRegularHours: 0,
            totalExtraWorkHours: 0,
            totalHours: 0,
            totalRegularSalary: 0,
            totalExtraWorkPayment: 0,
            totalSalary: 0
        });

        // Format period info for response
        const periodInfo = {
            startDate: start,
            endDate: end,
            startDateString: start.toISOString().split('T')[0],
            endDateString: end.toISOString().split('T')[0]
        };

        // Add month/year info if it's a full month
        if (start.getDate() === 1 && end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()) {
            periodInfo.year = start.getFullYear();
            periodInfo.month = start.getMonth() + 1;
            periodInfo.monthName = start.toLocaleString('en-US', { month: 'long' });
        }

        res.status(200).json({
            success: true,
            data: {
                period: periodInfo,
                overallSummary: {
                    totalMembers: overallSummary.totalMembers,
                    totalRegularHours: Math.round(overallSummary.totalRegularHours * 100) / 100,
                    totalExtraWorkHours: Math.round(overallSummary.totalExtraWorkHours * 100) / 100,
                    totalHours: Math.round(overallSummary.totalHours * 100) / 100,
                    totalRegularSalary: Math.round(overallSummary.totalRegularSalary * 100) / 100,
                    totalExtraWorkPayment: Math.round(overallSummary.totalExtraWorkPayment * 100) / 100,
                    totalSalary: Math.round(overallSummary.totalSalary * 100) / 100
                },
                members: salarySummaries
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMonthlySalary,
    getAllMembersSalarySummary
};

