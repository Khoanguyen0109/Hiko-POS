// @ts-nocheck
import type { SalaryMemberBlock, SalaryPeriodInfo, SalaryStoreBlock } from "../types/salary.js";

import Schedule from "../models/scheduleModel.js";
import User from "../models/userModel.js";
import ExtraWork from "../models/extraWorkModel.js";
import Store from "../models/storeModel.js";
import StoreUser from "../models/storeUserModel.js";
import Ticket from "../models/ticketModel.js";
import createHttpError from "http-errors";
import { getDateRangeVietnam, getCurrentVietnamTime, getStartOfDayVietnam, getEndOfDayVietnam, VIETNAM_TIMEZONE } from "../utils/dateUtils.js";
import { toZonedTime } from "date-fns-tz";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

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
            store: req.store._id,
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
        // Only count shifts with valid statuses (exclude "absent" and "cancelled")
        const validStatuses = ["scheduled", "confirmed", "completed"];
        let totalHours = 0;
        let totalShifts = 0;
        const shiftDetails: Array<Record<string, unknown>> = [];

        for (const schedule of schedules) {
            // Check if member is actually assigned to this schedule
            const memberAssignment = schedule.assignedMembers.find(
                am => am.member._id.toString() === memberId.toString()
            );

            // Only count shifts with valid statuses
            if (memberAssignment && schedule.shiftTemplate && validStatuses.includes(memberAssignment.status)) {
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
            store: req.store._id,
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
        const extraWorkDetails: Array<Record<string, unknown>> = [];

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
 * Get salary summary for all members across all stores (Admin only)
 * Supports date range filtering via startDate/endDate or period (today, week, month)
 * Also supports legacy year/month parameters for backward compatibility
 */
const getAllMembersSalarySummary = async (req, res, next) => {
    try {
        const { startDate, endDate, period, year, month } = req.query;

        // Date range setup - prioritize startDate/endDate, then period, then year/month
        let start, end;
        
        if (startDate && endDate) {
            const dateRange = getDateRangeVietnam(startDate, endDate);
            start = dateRange.start;
            end = dateRange.end;
        } else if (period) {
            const nowVN = toZonedTime(new Date(), VIETNAM_TIMEZONE);

            switch (period) {
                case 'today':
                    start = getStartOfDayVietnam(new Date());
                    end = getEndOfDayVietnam(new Date());
                    break;
                case 'week': {
                    start = getStartOfDayVietnam(startOfWeek(nowVN, { weekStartsOn: 1 }));
                    end = getEndOfDayVietnam(endOfWeek(nowVN, { weekStartsOn: 1 }));
                    break;
                }
                case 'month': {
                    start = getStartOfDayVietnam(startOfMonth(nowVN));
                    end = getEndOfDayVietnam(endOfMonth(nowVN));
                    break;
                }
                default:
                    start = getStartOfDayVietnam(startOfMonth(nowVN));
                    end = getEndOfDayVietnam(endOfMonth(nowVN));
            }
        } else if (year && month) {
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);

            if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
                const error = createHttpError(400, "Invalid year or month!");
                return next(error);
            }

            start = new Date(yearNum, monthNum - 1, 1);
            end = new Date(yearNum, monthNum, 0, 23, 59, 59);
        } else {
            const today = getCurrentVietnamTime();
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        if (!start || !end) {
            const error = createHttpError(400, "Invalid date range!");
            return next(error);
        }

        if (start > end) {
            const error = createHttpError(400, "Start date must be before end date!");
            return next(error);
        }

        const stores = await Store.find({ isActive: true })
            .select("_id name code")
            .sort({ name: 1 })
            .lean();

        const storeIds = stores.map((store) => store._id);

        const storeUsers = storeIds.length > 0
            ? await StoreUser.find({ store: { $in: storeIds }, isActive: true })
                .populate("user", "_id name salary role")
                .lean()
            : [];

        const membersByStore = new Map<string, Array<Record<string, unknown>>>();
        for (const storeUser of storeUsers) {
            const user = storeUser.user as Record<string, unknown> | null;
            if (!user || user.role === "Admin") continue;

            const storeId = storeUser.store.toString();
            if (!membersByStore.has(storeId)) {
                membersByStore.set(storeId, []);
            }
            membersByStore.get(storeId)!.push(user);
        }

        const validStatuses = ["scheduled", "confirmed", "completed"];

        const [schedules, extraWorkEntries, ticketAgg] = storeIds.length > 0
            ? await Promise.all([
                Schedule.find({
                    store: { $in: storeIds },
                    date: { $gte: start, $lte: end }
                })
                    .populate("shiftTemplate", "durationHours")
                    .lean(),
                ExtraWork.find({
                    store: { $in: storeIds },
                    date: { $gte: start, $lte: end }
                }).lean(),
                Ticket.aggregate([
                    {
                        $match: {
                            store: { $in: storeIds },
                            createdAt: { $gte: start, $lte: end }
                        }
                    },
                    {
                        $group: {
                            _id: { store: "$store", member: "$member" },
                            count: { $sum: 1 },
                            totalScore: { $sum: "$score" }
                        }
                    }
                ])
            ])
            : [[], [], []];

        const ticketMap = new Map<string, { count: number; totalScore: number }>(
            ticketAgg.map((row) => [
                `${row._id.store.toString()}_${row._id.member.toString()}`,
                { count: row.count, totalScore: row.totalScore }
            ])
        );

        const storeSummaries: SalaryStoreBlock[] = [];
        const overallSummary = {
            totalMembers: 0,
            totalRegularHours: 0,
            totalExtraWorkHours: 0,
            totalHours: 0,
            totalRegularSalary: 0,
            totalExtraWorkPayment: 0,
            totalSalary: 0,
            totalTickets: 0
        };

        for (const store of stores) {
            const storeId = store._id.toString();
            const storeMembers = membersByStore.get(storeId) || [];
            const memberSummaries: SalaryMemberBlock[] = [];

            const storeSummary = {
                totalMembers: 0,
                totalRegularHours: 0,
                totalExtraWorkHours: 0,
                totalHours: 0,
                totalRegularSalary: 0,
                totalExtraWorkPayment: 0,
                totalSalary: 0,
                totalTickets: 0
            };

            for (const member of storeMembers) {
                const memberId = member._id.toString();
                const hourlyRate = member.salary || 0;

                let totalHours = 0;
                let totalShifts = 0;

                for (const schedule of schedules) {
                    if (schedule.store.toString() !== storeId) continue;

                    const memberAssignment = schedule.assignedMembers.find((assignment) => {
                        const memberRefId = assignment.member?._id
                            ? assignment.member._id.toString()
                            : assignment.member.toString();
                        return memberRefId === memberId;
                    });

                    if (
                        memberAssignment &&
                        schedule.shiftTemplate &&
                        validStatuses.includes(memberAssignment.status)
                    ) {
                        totalHours += schedule.shiftTemplate.durationHours || 0;
                        totalShifts++;
                    }
                }

                const regularSalary = totalHours * hourlyRate;

                let extraWorkHours = 0;
                let extraWorkPayment = 0;

                for (const entry of extraWorkEntries) {
                    if (
                        entry.store.toString() === storeId &&
                        entry.member.toString() === memberId
                    ) {
                        extraWorkHours += entry.durationHours || 0;
                        extraWorkPayment += entry.paymentAmount || 0;
                    }
                }

                const combinedTotalHours = totalHours + extraWorkHours;
                const combinedTotalSalary = regularSalary + extraWorkPayment;
                const tickets = ticketMap.get(`${storeId}_${memberId}`) || {
                    count: 0,
                    totalScore: 0
                };

                const summary = {
                    totalShifts,
                    regularHours: Math.round(totalHours * 100) / 100,
                    extraWorkHours: Math.round(extraWorkHours * 100) / 100,
                    totalHours: Math.round(combinedTotalHours * 100) / 100,
                    hourlyRate,
                    regularSalary: Math.round(regularSalary * 100) / 100,
                    extraWorkPayment: Math.round(extraWorkPayment * 100) / 100,
                    totalSalary: Math.round(combinedTotalSalary * 100) / 100
                };

                memberSummaries.push({
                    member: {
                        id: member._id,
                        name: member.name,
                        role: member.role,
                        hourlyRate
                    },
                    summary,
                    tickets
                });

                storeSummary.totalMembers += 1;
                storeSummary.totalRegularHours += summary.regularHours;
                storeSummary.totalExtraWorkHours += summary.extraWorkHours;
                storeSummary.totalHours += summary.totalHours;
                storeSummary.totalRegularSalary += summary.regularSalary;
                storeSummary.totalExtraWorkPayment += summary.extraWorkPayment;
                storeSummary.totalSalary += summary.totalSalary;
                storeSummary.totalTickets += tickets.count;
            }

            memberSummaries.sort(
                (a, b) => (b.summary?.totalSalary || 0) - (a.summary?.totalSalary || 0)
            );

            storeSummaries.push({
                store: {
                    id: store._id,
                    name: store.name,
                    code: store.code
                },
                summary: {
                    totalMembers: storeSummary.totalMembers,
                    totalRegularHours: Math.round(storeSummary.totalRegularHours * 100) / 100,
                    totalExtraWorkHours: Math.round(storeSummary.totalExtraWorkHours * 100) / 100,
                    totalHours: Math.round(storeSummary.totalHours * 100) / 100,
                    totalRegularSalary: Math.round(storeSummary.totalRegularSalary * 100) / 100,
                    totalExtraWorkPayment: Math.round(storeSummary.totalExtraWorkPayment * 100) / 100,
                    totalSalary: Math.round(storeSummary.totalSalary * 100) / 100,
                    totalTickets: storeSummary.totalTickets
                },
                members: memberSummaries
            });

            overallSummary.totalMembers += storeSummary.totalMembers;
            overallSummary.totalRegularHours += storeSummary.totalRegularHours;
            overallSummary.totalExtraWorkHours += storeSummary.totalExtraWorkHours;
            overallSummary.totalHours += storeSummary.totalHours;
            overallSummary.totalRegularSalary += storeSummary.totalRegularSalary;
            overallSummary.totalExtraWorkPayment += storeSummary.totalExtraWorkPayment;
            overallSummary.totalSalary += storeSummary.totalSalary;
            overallSummary.totalTickets += storeSummary.totalTickets;
        }

        const periodInfo: SalaryPeriodInfo = {
            startDate: start,
            endDate: end,
            startDateString: start.toISOString().split("T")[0],
            endDateString: end.toISOString().split("T")[0]
        };

        if (
            start.getDate() === 1 &&
            end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
        ) {
            periodInfo.year = start.getFullYear();
            periodInfo.month = start.getMonth() + 1;
            periodInfo.monthName = start.toLocaleString("en-US", { month: "long" });
        }

        const flatMembers = storeSummaries.flatMap((storeBlock) => storeBlock.members);

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
                    totalSalary: Math.round(overallSummary.totalSalary * 100) / 100,
                    totalTickets: overallSummary.totalTickets
                },
                stores: storeSummaries,
                members: flatMembers
            }
        });

    } catch (error) {
        next(error);
    }
};

export {
    getMonthlySalary,
    getAllMembersSalarySummary
};