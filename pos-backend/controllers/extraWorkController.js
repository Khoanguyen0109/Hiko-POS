const createHttpError = require("http-errors");
const ExtraWork = require("../models/extraWorkModel");
const User = require("../models/userModel");

// Get all extra work entries (with filters)
const getAllExtraWork = async (req, res, next) => {
    try {
        const { 
            memberId, 
            startDate, 
            endDate, 
            isApproved, 
            isPaid,
            workType 
        } = req.query;
        
        const query = {};
        
        if (memberId) query.member = memberId;
        if (workType) query.workType = workType;
        if (isApproved !== undefined) query.isApproved = isApproved === 'true';
        if (isPaid !== undefined) query.isPaid = isPaid === 'true';
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        const extraWorkEntries = await ExtraWork.find(query)
            .populate('member', 'name email phone role salary')
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .sort({ date: -1, createdAt: -1 });
        
        const totalHours = extraWorkEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
        const totalPayment = extraWorkEntries.reduce((sum, entry) => sum + entry.paymentAmount, 0);
        
        res.status(200).json({
            success: true,
            count: extraWorkEntries.length,
            totalHours,
            totalPayment,
            data: extraWorkEntries
        });
    } catch (error) {
        next(error);
    }
};

// Get extra work by ID
const getExtraWorkById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const extraWork = await ExtraWork.findById(id)
            .populate('member', 'name email phone role salary')
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');
        
        if (!extraWork) {
            return next(createHttpError(404, "Extra work entry not found"));
        }
        
        res.status(200).json({
            success: true,
            data: extraWork
        });
    } catch (error) {
        next(error);
    }
};

// Get extra work by member
const getExtraWorkByMember = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const { startDate, endDate } = req.query;
        
        const query = { member: memberId };
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        const extraWorkEntries = await ExtraWork.find(query)
            .populate('member', 'name email phone role')
            .sort({ date: -1 });
        
        const totalHours = extraWorkEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
        const totalPayment = extraWorkEntries.reduce((sum, entry) => sum + entry.paymentAmount, 0);
        
        res.status(200).json({
            success: true,
            count: extraWorkEntries.length,
            totalHours,
            totalPayment,
            data: extraWorkEntries
        });
    } catch (error) {
        next(error);
    }
};

// Create extra work entry
const createExtraWork = async (req, res, next) => {
    try {
        const { 
            memberId, 
            date, 
            durationHours,
            workType,
            description,
            hourlyRate,
            notes 
        } = req.body;
        
        if (!memberId || !date || durationHours === undefined || durationHours === null) {
            return next(createHttpError(400, "Member, date, and duration are required"));
        }
        
        if (typeof durationHours !== 'number') {
            return next(createHttpError(400, "Duration must be a number"));
        }
        
        const member = await User.findById(memberId);
        if (!member) {
            return next(createHttpError(404, "Member not found"));
        }
        
        // Use member's salary as default hourly rate if not provided
        const rate = hourlyRate !== undefined && hourlyRate !== null ? hourlyRate : (member.salary || 0);
        
        const extraWork = new ExtraWork({
            member: memberId,
            date: new Date(date),
            durationHours: parseFloat(durationHours),
            workType: workType || "overtime",
            description: description || "",
            hourlyRate: rate,
            notes: notes || "",
            createdBy: req.user._id
        });
        
        await extraWork.save();
        
        await extraWork.populate([
            { path: 'member', select: 'name email phone role salary' },
            { path: 'createdBy', select: 'name email' }
        ]);
        
        res.status(201).json({
            success: true,
            message: "Extra work entry created successfully",
            data: extraWork
        });
    } catch (error) {
        next(error);
    }
};

// Update extra work entry
const updateExtraWork = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            date, 
            durationHours,
            workType,
            description,
            hourlyRate,
            notes 
        } = req.body;
        
        const extraWork = await ExtraWork.findById(id);
        if (!extraWork) {
            return next(createHttpError(404, "Extra work entry not found"));
        }
        
        if (extraWork.isPaid) {
            return next(createHttpError(400, "Cannot update paid entries"));
        }
        
        if (date) extraWork.date = new Date(date);
        if (durationHours !== undefined && durationHours !== null) {
            if (typeof durationHours !== 'number') {
                return next(createHttpError(400, "Duration must be a number"));
            }
            extraWork.durationHours = parseFloat(durationHours);
        }
        if (workType) extraWork.workType = workType;
        if (description !== undefined) extraWork.description = description;
        if (hourlyRate !== undefined && hourlyRate !== null) extraWork.hourlyRate = hourlyRate;
        if (notes !== undefined) extraWork.notes = notes;
        
        extraWork.lastModifiedBy = req.user._id;
        await extraWork.save();
        
        await extraWork.populate([
            { path: 'member', select: 'name email phone role salary' },
            { path: 'createdBy', select: 'name email' },
            { path: 'approvedBy', select: 'name email' }
        ]);
        
        res.status(200).json({
            success: true,
            message: "Extra work entry updated successfully",
            data: extraWork
        });
    } catch (error) {
        next(error);
    }
};

// Delete extra work entry
const deleteExtraWork = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const extraWork = await ExtraWork.findById(id);
        if (!extraWork) {
            return next(createHttpError(404, "Extra work entry not found"));
        }
        
        if (extraWork.isPaid) {
            return next(createHttpError(400, "Cannot delete paid entries"));
        }
        
        await ExtraWork.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Extra work entry deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Approve extra work entry
const approveExtraWork = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const extraWork = await ExtraWork.findById(id);
        if (!extraWork) {
            return next(createHttpError(404, "Extra work entry not found"));
        }
        
        extraWork.isApproved = true;
        extraWork.approvedBy = req.user._id;
        extraWork.approvedAt = new Date();
        extraWork.lastModifiedBy = req.user._id;
        
        await extraWork.save();
        
        await extraWork.populate([
            { path: 'member', select: 'name email phone role' },
            { path: 'approvedBy', select: 'name email' }
        ]);
        
        res.status(200).json({
            success: true,
            message: "Extra work entry approved successfully",
            data: extraWork
        });
    } catch (error) {
        next(error);
    }
};

// Mark as paid
const markAsPaid = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const extraWork = await ExtraWork.findById(id);
        if (!extraWork) {
            return next(createHttpError(404, "Extra work entry not found"));
        }
        
        if (!extraWork.isApproved) {
            return next(createHttpError(400, "Extra work must be approved before marking as paid"));
        }
        
        extraWork.isPaid = true;
        extraWork.paidAt = new Date();
        extraWork.lastModifiedBy = req.user._id;
        
        await extraWork.save();
        
        await extraWork.populate([
            { path: 'member', select: 'name email phone role' },
            { path: 'approvedBy', select: 'name email' }
        ]);
        
        res.status(200).json({
            success: true,
            message: "Extra work entry marked as paid successfully",
            data: extraWork
        });
    } catch (error) {
        next(error);
    }
};

// Get member's own extra work
const getMyExtraWork = async (req, res, next) => {
    try {
        const memberId = req.user._id;
        const { startDate, endDate } = req.query;
        
        const query = { member: memberId };
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        const extraWorkEntries = await ExtraWork.find(query)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .sort({ date: -1 });
        
        const totalHours = extraWorkEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
        const totalPayment = extraWorkEntries.reduce((sum, entry) => sum + entry.paymentAmount, 0);
        
        res.status(200).json({
            success: true,
            count: extraWorkEntries.length,
            totalHours,
            totalPayment,
            data: extraWorkEntries
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllExtraWork,
    getExtraWorkById,
    getExtraWorkByMember,
    createExtraWork,
    updateExtraWork,
    deleteExtraWork,
    approveExtraWork,
    markAsPaid,
    getMyExtraWork
};

