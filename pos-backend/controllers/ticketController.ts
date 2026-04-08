// @ts-nocheck
import type { MongoFilter } from "../types/mongo.js";

import createHttpError from "http-errors";
import Ticket from "../models/ticketModel.js";
import StoreUser from "../models/storeUserModel.js";
import User from "../models/userModel.js";

// GET /api/ticket — list tickets for the active store
const getTickets = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const { memberId, month, year, page = 1, limit = 50 } = req.query;

        const pageNum  = Math.max(1, parseInt(page,  10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const skip     = (pageNum - 1) * limitNum;

        const filter: MongoFilter = { store: storeId };

        if (memberId) filter.member = memberId;

        if (month && year) {
            const y = parseInt(year, 10);
            const m = parseInt(month, 10);
            filter.createdAt = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
        } else if (year) {
            const y = parseInt(year, 10);
            filter.createdAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(filter)
                .populate({ path: "member", select: "name email role" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Ticket.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: tickets,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNext: pageNum * limitNum < total,
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/ticket — create a ticket
const createTicket = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const { memberId, title, score, note } = req.body;

        if (!memberId || !title || score === undefined) {
            return next(createHttpError(400, "memberId, title, and score are required."));
        }

        const scoreNum = Number(score);
        if (!Number.isInteger(scoreNum) || scoreNum < 1) {
            return next(createHttpError(400, "Score must be an integer of at least 1."));
        }

        if (!title.trim()) {
            return next(createHttpError(400, "Title cannot be empty."));
        }

        if (title.trim().length > 200) {
            return next(createHttpError(400, "Title cannot exceed 200 characters."));
        }

        // Verify member belongs to this store
        const storeUser = await StoreUser.findOne({ user: memberId, store: storeId, isActive: true });
        if (!storeUser) {
            const exists = await User.exists({ _id: memberId });
            if (!exists) return next(createHttpError(400, "Member not found."));
            return next(createHttpError(400, "Member is not assigned to this store."));
        }

        const ticket = await Ticket.create({
            store: storeId,
            member: memberId,
            title: title.trim(),
            score: scoreNum,
            note: note ? note.trim() : "",
            createdBy: {
                userId: req.user._id,
                userName: req.user.name
            }
        });

        const populated = await Ticket.findById(ticket._id)
            .populate({ path: "member", select: "name email role" })
            .lean();

        res.status(201).json({
            success: true,
            message: "Ticket created successfully!",
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/ticket/:id — update a ticket
const updateTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const storeId = req.store._id;
        const { title, score, note } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) return next(createHttpError(404, "Ticket not found."));

        if (ticket.store.toString() !== storeId.toString()) {
            return next(createHttpError(403, "Access denied."));
        }

        if (score !== undefined) {
            const scoreNum = Number(score);
            if (!Number.isInteger(scoreNum) || scoreNum < 1) {
                return next(createHttpError(400, "Score must be an integer of at least 1."));
            }
            ticket.score = scoreNum;
        }

        if (title !== undefined) {
            if (!title.trim()) return next(createHttpError(400, "Title cannot be empty."));
            if (title.trim().length > 200) return next(createHttpError(400, "Title cannot exceed 200 characters."));
            ticket.title = title.trim();
        }

        if (note !== undefined) ticket.note = note.trim();

        await ticket.save();

        const updated = await Ticket.findById(id)
            .populate({ path: "member", select: "name email role" })
            .lean();

        res.status(200).json({
            success: true,
            message: "Ticket updated successfully!",
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/ticket/:id — delete a ticket
const deleteTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const storeId = req.store._id;

        const ticket = await Ticket.findById(id);
        if (!ticket) return next(createHttpError(404, "Ticket not found."));

        if (ticket.store.toString() !== storeId.toString()) {
            return next(createHttpError(403, "Access denied."));
        }

        await Ticket.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Ticket deleted successfully!"
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/ticket/summary — per-member leaderboard with monthly + all-time totals
const getTicketSummary = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const now = new Date();
        const targetMonth = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
        const targetYear  = parseInt(req.query.year  as string, 10) || now.getFullYear();

        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        const monthEnd   = new Date(targetYear, targetMonth, 1);

        const [monthlyAgg, allTimeAgg] = await Promise.all([
            Ticket.aggregate([
                { $match: { store: storeId, createdAt: { $gte: monthStart, $lt: monthEnd } } },
                { $group: { _id: "$member", monthlyScore: { $sum: "$score" }, monthlyCount: { $sum: 1 } } }
            ]),
            Ticket.aggregate([
                { $match: { store: storeId } },
                { $group: { _id: "$member", allTimeScore: { $sum: "$score" }, allTimeCount: { $sum: 1 } } }
            ])
        ]);

        const monthlyMap = new Map(monthlyAgg.map(r => [r._id.toString(), r]));
        const allTimeMap = new Map(allTimeAgg.map(r => [r._id.toString(), r]));
        const memberIds  = [...new Set([...monthlyMap.keys(), ...allTimeMap.keys()])];

        const users = await User.find({ _id: { $in: memberIds } }).select("name role").lean();

        const members = users.map(u => {
            const id      = u._id.toString();
            const monthly = monthlyMap.get(id) || { monthlyScore: 0, monthlyCount: 0 };
            const allTime = allTimeMap.get(id)  || { allTimeScore: 0, allTimeCount: 0 };
            return {
                memberId:     u._id,
                memberName:   u.name,
                memberRole:   u.role,
                monthlyScore: monthly.monthlyScore,
                monthlyCount: monthly.monthlyCount,
                allTimeScore: allTime.allTimeScore,
                allTimeCount: allTime.allTimeCount
            };
        }).sort((a, b) => b.monthlyScore - a.monthlyScore);

        res.status(200).json({
            success: true,
            data: { month: targetMonth, year: targetYear, members }
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/ticket/my-tickets — logged-in member's own tickets + totals
const getMyTickets = async (req, res, next) => {
    try {
        const storeId  = req.store._id;
        const memberId = req.user._id;
        const now = new Date();
        const targetMonth = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
        const targetYear  = parseInt(req.query.year  as string, 10) || now.getFullYear();

        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        const monthEnd   = new Date(targetYear, targetMonth, 1);

        const [monthlyTickets, allTimeAgg] = await Promise.all([
            Ticket.find({ store: storeId, member: memberId, createdAt: { $gte: monthStart, $lt: monthEnd } })
                .sort({ createdAt: -1 })
                .lean(),
            Ticket.aggregate([
                { $match: { store: storeId, member: memberId } },
                { $group: { _id: null, allTimeScore: { $sum: "$score" }, allTimeCount: { $sum: 1 } } }
            ])
        ]);

        const monthlyScore = monthlyTickets.reduce((sum, t) => sum + t.score, 0);
        const allTimeScore = allTimeAgg[0]?.allTimeScore || 0;
        const allTimeCount = allTimeAgg[0]?.allTimeCount || 0;

        res.status(200).json({
            success: true,
            data: {
                month: targetMonth,
                year:  targetYear,
                monthlyScore,
                monthlyCount: monthlyTickets.length,
                allTimeScore,
                allTimeCount,
                tickets: monthlyTickets
            }
        });
    } catch (error) {
        next(error);
    }
};

export { getTickets, createTicket, updateTicket, deleteTicket, getTicketSummary, getMyTickets };
