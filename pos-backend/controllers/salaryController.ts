// @ts-nocheck
import type { SalaryMemberBlock, SalaryPeriodInfo, SalaryStoreBlock } from "../types/salary.js";

import Schedule from "../models/scheduleModel.js";
import User from "../models/userModel.js";
import ExtraWork from "../models/extraWorkModel.js";
import Store from "../models/storeModel.js";
import StoreUser from "../models/storeUserModel.js";
import Ticket from "../models/ticketModel.js";
import createHttpError from "http-errors";
import { userRoles } from "../constants/user.js";
import { getDateRangeVietnam, getCurrentVietnamTime, getStartOfDayVietnam, getEndOfDayVietnam, VIETNAM_TIMEZONE } from "../utils/dateUtils.js";
import { toZonedTime } from "date-fns-tz";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { pickAssignedStores } from "../utils/assignedStores.js";
import { buildMemberMonthlySalary } from "../utils/memberMonthlySalary.js";

/**
 * Get member's monthly salary based on assigned shifts
 * Only the logged-in member can view their own salary
 */
const getMonthlySalary = async (req, res, next) => {
    try {
        const { year, month } = req.params;
        const memberId = req.user._id;

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
            const error = createHttpError(400, "Invalid year or month!");
            return next(error);
        }

        const member = await User.findById(memberId).select("salary name role");
        if (!member) {
            const error = createHttpError(404, "Member not found!");
            return next(error);
        }

        const assignments = await StoreUser.find({
            user: memberId,
            isActive: true
        })
            .populate("store", "name code isActive")
            .lean();

        const assignedStores = pickAssignedStores(assignments, {
            isAdmin: req.user.role === userRoles.ADMIN,
            fallbackStore: req.store
        });
        const assignedStoreIds = assignedStores.map((store) => store.id);

        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        const [schedules, extraWorkEntries, tickets] = assignedStoreIds.length > 0
            ? await Promise.all([
                Schedule.find({
                    store: { $in: assignedStoreIds },
                    "assignedMembers.member": memberId,
                    date: { $gte: startDate, $lte: endDate }
                })
                    .populate("shiftTemplate", "name shortName startTime endTime durationHours color")
                    .populate("assignedMembers.member", "name")
                    .sort({ date: 1 })
                    .lean(),
                ExtraWork.find({
                    store: { $in: assignedStoreIds },
                    member: memberId,
                    date: { $gte: startDate, $lte: endDate }
                })
                    .sort({ date: 1 })
                    .lean(),
                Ticket.find({
                    store: { $in: assignedStoreIds },
                    member: memberId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }).lean()
            ])
            : [[], [], []];

        const data = buildMemberMonthlySalary({
            member,
            year: yearNum,
            month: monthNum,
            assignedStores,
            schedules,
            extraWork: extraWorkEntries,
            tickets
        });

        res.status(200).json({
            success: true,
            data
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
            totalTickets: 0,
            totalTicketScore: 0
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
                totalTickets: 0,
                totalTicketScore: 0
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
                storeSummary.totalTicketScore = (storeSummary.totalTicketScore || 0) + tickets.totalScore;
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
            overallSummary.totalTicketScore += storeSummary.totalTicketScore;
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

        const memberTicketTotalMap = new Map<string, { count: number; totalScore: number }>();
        for (const row of ticketAgg) {
            const memberId = row._id.member.toString();
            const existing = memberTicketTotalMap.get(memberId) || { count: 0, totalScore: 0 };
            existing.count += row.count;
            existing.totalScore += row.totalScore;
            memberTicketTotalMap.set(memberId, existing);
        }

        const membersSummaryMap = new Map<string, Record<string, unknown>>();

        for (const storeBlock of storeSummaries) {
            const storeId = storeBlock.store.id.toString();

            for (const entry of storeBlock.members) {
                const memberId = entry.member.id.toString();

                if (!membersSummaryMap.has(memberId)) {
                    membersSummaryMap.set(memberId, {
                        member: entry.member,
                        storeSalaries: {},
                        storeTickets: {},
                        totalHours: 0,
                        totalSalary: 0,
                        totalTickets: 0,
                        totalTicketScore: 0
                    });
                }

                const row = membersSummaryMap.get(memberId)!;
                row.storeSalaries[storeId] = entry.summary.totalSalary;
                row.storeTickets[storeId] = entry.tickets?.count || 0;
                row.totalHours += entry.summary.totalHours;
                row.totalSalary += entry.summary.totalSalary;
            }
        }

        const missingMemberIds = [...memberTicketTotalMap.keys()].filter(
            (memberId) => !membersSummaryMap.has(memberId)
        );

        if (missingMemberIds.length > 0) {
            const ticketOnlyMembers = await User.find({
                _id: { $in: missingMemberIds },
                role: { $ne: "Admin" }
            }).select("_id name salary role");

            for (const member of ticketOnlyMembers) {
                const memberId = member._id.toString();
                membersSummaryMap.set(memberId, {
                    member: {
                        id: member._id,
                        name: member.name,
                        role: member.role,
                        hourlyRate: member.salary || 0
                    },
                    storeSalaries: {},
                    storeTickets: {},
                    totalHours: 0,
                    totalSalary: 0,
                    totalTickets: 0,
                    totalTicketScore: 0
                });
            }
        }

        for (const [memberId, tickets] of memberTicketTotalMap) {
            const row = membersSummaryMap.get(memberId);
            if (!row) continue;
            row.totalTickets = tickets.count;
            row.totalTicketScore = tickets.totalScore;
        }

        const membersSummary = [...membersSummaryMap.values()]
            .map((row) => ({
                member: row.member,
                storeSalaries: row.storeSalaries,
                storeTickets: row.storeTickets,
                totalHours: Math.round(row.totalHours * 100) / 100,
                totalTickets: row.totalTickets,
                totalTicketScore: row.totalTicketScore,
                totalSalary: Math.round(row.totalSalary * 100) / 100
            }))
            .sort((a, b) => b.totalSalary - a.totalSalary);

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
                    totalTickets: overallSummary.totalTickets,
                    totalTicketScore: overallSummary.totalTicketScore
                },
                stores: storeSummaries,
                members: flatMembers,
                membersSummary
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