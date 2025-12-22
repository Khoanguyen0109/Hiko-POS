const Schedule = require('../models/scheduleModel');
const User = require('../models/userModel');
const ExtraWork = require('../models/extraWorkModel');
const createHttpError = require('http-errors');

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

module.exports = {
    getMonthlySalary
};

