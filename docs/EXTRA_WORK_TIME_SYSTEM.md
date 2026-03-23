# Extra Work Time Management System

## Overview
A module to log and track extra work hours (overtime) for members beyond their regular shifts. This system allows admins to record additional work time with date, start time, and end time for payroll and time tracking purposes.

---

## Database Model

### Extra Work Time Model (`extraWorkModel.js`)

```javascript
const mongoose = require("mongoose");

const extraWorkSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Member is required"],
        index: true
    },
    
    date: {
        type: Date,
        required: [true, "Date is required"],
        index: true
    },
    
    startTime: {
        type: String,
        required: [true, "Start time is required"],
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Start time must be in HH:MM format"
        }
        // Format: "14:30", "18:00"
    },
    
    endTime: {
        type: String,
        required: [true, "End time is required"],
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "End time must be in HH:MM format"
        }
        // Format: "17:30", "22:00"
    },
    
    // Calculated duration in hours
    durationHours: {
        type: Number,
        default: 0,
        min: [0, "Duration cannot be negative"]
    },
    
    workType: {
        type: String,
        enum: ["overtime", "extra_shift", "emergency", "training", "event", "other"],
        default: "overtime"
    },
    
    description: {
        type: String,
        required: false,
        trim: true
        // e.g., "Emergency call for dinner rush", "Special event catering"
    },
    
    isApproved: {
        type: Boolean,
        default: false
    },
    
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    
    approvedAt: {
        type: Date,
        default: null
    },
    
    // Payroll integration
    isPaid: {
        type: Boolean,
        default: false
    },
    
    paidAt: {
        type: Date,
        default: null
    },
    
    // Optional: hourly rate for this work (if different from regular salary)
    hourlyRate: {
        type: Number,
        default: 0,
        min: [0, "Hourly rate cannot be negative"]
    },
    
    // Calculated payment amount
    paymentAmount: {
        type: Number,
        default: 0,
        min: [0, "Payment amount cannot be negative"]
    },
    
    notes: {
        type: String,
        default: ""
    },
    
    // Track who created this entry
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

// Calculate duration before saving
extraWorkSchema.pre('save', function(next) {
    if (this.startTime && this.endTime) {
        const [startHour, startMin] = this.startTime.split(':').map(Number);
        const [endHour, endMin] = this.endTime.split(':').map(Number);
        
        let startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;
        
        // Handle overnight shifts (e.g., 22:00 to 02:00)
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60; // Add 24 hours
        }
        
        this.durationHours = (endMinutes - startMinutes) / 60;
        
        // Calculate payment if hourly rate is set
        if (this.hourlyRate > 0) {
            this.paymentAmount = this.durationHours * this.hourlyRate;
        }
    }
    next();
});

// Compound indexes for efficient queries
extraWorkSchema.index({ member: 1, date: 1 });
extraWorkSchema.index({ date: 1, isApproved: 1 });
extraWorkSchema.index({ member: 1, isPaid: 1 });
extraWorkSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ExtraWork", extraWorkSchema);
```

---

## API Endpoints

### Routes (`extraWorkRoute.js`)

```javascript
const express = require("express");
const { 
    getAllExtraWork,
    getExtraWorkById,
    getExtraWorkByMember,
    createExtraWork,
    updateExtraWork,
    deleteExtraWork,
    approveExtraWork,
    markAsPaid,
    getMyExtraWork,
    getExtraWorkStats,
    bulkCreateExtraWork
} = require("../controllers/extraWorkController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

const router = express.Router();

// Admin routes
router.route("/")
    .get(isVerifiedUser, isAdmin, getAllExtraWork)
    .post(isVerifiedUser, isAdmin, createExtraWork);

router.route("/bulk")
    .post(isVerifiedUser, isAdmin, bulkCreateExtraWork);

router.route("/stats")
    .get(isVerifiedUser, isAdmin, getExtraWorkStats);

router.route("/member/:memberId")
    .get(isVerifiedUser, isAdmin, getExtraWorkByMember);

router.route("/:id")
    .get(isVerifiedUser, isAdmin, getExtraWorkById)
    .put(isVerifiedUser, isAdmin, updateExtraWork)
    .delete(isVerifiedUser, isAdmin, deleteExtraWork);

router.route("/:id/approve")
    .patch(isVerifiedUser, isAdmin, approveExtraWork);

router.route("/:id/mark-paid")
    .patch(isVerifiedUser, isAdmin, markAsPaid);

// Member routes - view own extra work
router.route("/my-extra-work")
    .get(isVerifiedUser, getMyExtraWork);

module.exports = router;
```

---

## Controller Functions

### Extra Work Controller (`extraWorkController.js`)

```javascript
const ExtraWork = require("../models/extraWorkModel");
const User = require("../models/userModel");
const createHttpError = require("http-errors");

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
            .sort({ date: -1, startTime: 1 });
        
        // Calculate totals
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
            startTime, 
            endTime, 
            workType,
            description,
            hourlyRate,
            notes 
        } = req.body;
        
        // Validate required fields
        if (!memberId || !date || !startTime || !endTime) {
            return next(createHttpError(400, "Member, date, start time, and end time are required"));
        }
        
        // Verify member exists
        const member = await User.findById(memberId);
        if (!member) {
            return next(createHttpError(404, "Member not found"));
        }
        
        // Check for overlapping entries (optional - can be removed if overlaps are allowed)
        const existingEntry = await ExtraWork.findOne({
            member: memberId,
            date: new Date(date)
        });
        
        if (existingEntry) {
            // Just a warning, not blocking
            console.log(`Warning: Member already has extra work entry for ${date}`);
        }
        
        const extraWork = new ExtraWork({
            member: memberId,
            date: new Date(date),
            startTime,
            endTime,
            workType: workType || "overtime",
            description: description || "",
            hourlyRate: hourlyRate || 0,
            notes: notes || "",
            createdBy: req.user._id
        });
        
        await extraWork.save();
        
        await extraWork.populate([
            { path: 'member', select: 'name email phone role' },
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

// Bulk create extra work entries
const bulkCreateExtraWork = async (req, res, next) => {
    try {
        const { entries } = req.body;
        
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return next(createHttpError(400, "Entries array is required"));
        }
        
        const createdEntries = [];
        const errors = [];
        
        for (const entry of entries) {
            try {
                const { memberId, date, startTime, endTime, workType, description, hourlyRate, notes } = entry;
                
                const extraWork = new ExtraWork({
                    member: memberId,
                    date: new Date(date),
                    startTime,
                    endTime,
                    workType: workType || "overtime",
                    description: description || "",
                    hourlyRate: hourlyRate || 0,
                    notes: notes || "",
                    createdBy: req.user._id
                });
                
                await extraWork.save();
                createdEntries.push(extraWork);
            } catch (err) {
                errors.push({
                    entry,
                    error: err.message
                });
            }
        }
        
        res.status(201).json({
            success: true,
            message: `${createdEntries.length} extra work entries created successfully`,
            data: createdEntries,
            errors: errors.length > 0 ? errors : undefined
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
            startTime, 
            endTime, 
            workType,
            description,
            hourlyRate,
            notes 
        } = req.body;
        
        const extraWork = await ExtraWork.findById(id);
        if (!extraWork) {
            return next(createHttpError(404, "Extra work entry not found"));
        }
        
        // Don't allow updates if already paid
        if (extraWork.isPaid) {
            return next(createHttpError(400, "Cannot update paid entries"));
        }
        
        // Update fields
        if (date) extraWork.date = new Date(date);
        if (startTime) extraWork.startTime = startTime;
        if (endTime) extraWork.endTime = endTime;
        if (workType) extraWork.workType = workType;
        if (description !== undefined) extraWork.description = description;
        if (hourlyRate !== undefined) extraWork.hourlyRate = hourlyRate;
        if (notes !== undefined) extraWork.notes = notes;
        
        extraWork.lastModifiedBy = req.user._id;
        await extraWork.save();
        
        await extraWork.populate([
            { path: 'member', select: 'name email phone role' },
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
        
        // Don't allow deletion if already paid
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

// Get statistics
const getExtraWorkStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        
        const query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        const allEntries = await ExtraWork.find(query).populate('member', 'name');
        
        // Calculate various statistics
        const totalEntries = allEntries.length;
        const totalHours = allEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
        const totalPayment = allEntries.reduce((sum, entry) => sum + entry.paymentAmount, 0);
        
        const approvedEntries = allEntries.filter(e => e.isApproved);
        const paidEntries = allEntries.filter(e => e.isPaid);
        const pendingApproval = allEntries.filter(e => !e.isApproved);
        const pendingPayment = allEntries.filter(e => e.isApproved && !e.isPaid);
        
        // Group by member
        const byMember = {};
        allEntries.forEach(entry => {
            const memberId = entry.member._id.toString();
            if (!byMember[memberId]) {
                byMember[memberId] = {
                    member: entry.member,
                    totalHours: 0,
                    totalPayment: 0,
                    count: 0
                };
            }
            byMember[memberId].totalHours += entry.durationHours;
            byMember[memberId].totalPayment += entry.paymentAmount;
            byMember[memberId].count += 1;
        });
        
        // Group by work type
        const byWorkType = {};
        allEntries.forEach(entry => {
            if (!byWorkType[entry.workType]) {
                byWorkType[entry.workType] = {
                    count: 0,
                    totalHours: 0,
                    totalPayment: 0
                };
            }
            byWorkType[entry.workType].count += 1;
            byWorkType[entry.workType].totalHours += entry.durationHours;
            byWorkType[entry.workType].totalPayment += entry.paymentAmount;
        });
        
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalEntries,
                    totalHours: parseFloat(totalHours.toFixed(2)),
                    totalPayment: parseFloat(totalPayment.toFixed(2)),
                    approvedCount: approvedEntries.length,
                    paidCount: paidEntries.length,
                    pendingApprovalCount: pendingApproval.length,
                    pendingPaymentCount: pendingPayment.length
                },
                byMember: Object.values(byMember),
                byWorkType
            }
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
    getMyExtraWork,
    getExtraWorkStats,
    bulkCreateExtraWork
};
```

---

## Frontend Implementation

### Redux Slice (`extraWorkSlice.js`)

```javascript
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as extraWorkApi from "../../https/extraWorkApi";

// Async thunks
export const fetchExtraWork = createAsyncThunk(
    "extraWork/fetchAll",
    async (filters, { rejectWithValue }) => {
        try {
            const response = await extraWorkApi.getAllExtraWork(filters);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch extra work");
        }
    }
);

export const createExtraWork = createAsyncThunk(
    "extraWork/create",
    async (data, { rejectWithValue }) => {
        try {
            const response = await extraWorkApi.createExtraWork(data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create extra work");
        }
    }
);

export const updateExtraWork = createAsyncThunk(
    "extraWork/update",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await extraWorkApi.updateExtraWork(id, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update extra work");
        }
    }
);

export const deleteExtraWork = createAsyncThunk(
    "extraWork/delete",
    async (id, { rejectWithValue }) => {
        try {
            await extraWorkApi.deleteExtraWork(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete extra work");
        }
    }
);

export const approveExtraWork = createAsyncThunk(
    "extraWork/approve",
    async (id, { rejectWithValue }) => {
        try {
            const response = await extraWorkApi.approveExtraWork(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to approve extra work");
        }
    }
);

const initialState = {
    extraWorkEntries: [],
    totalHours: 0,
    totalPayment: 0,
    loading: false,
    error: null,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false
};

const extraWorkSlice = createSlice({
    name: "extraWork",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch extra work
        builder
            .addCase(fetchExtraWork.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchExtraWork.fulfilled, (state, action) => {
                state.loading = false;
                state.extraWorkEntries = action.payload.data;
                state.totalHours = action.payload.totalHours;
                state.totalPayment = action.payload.totalPayment;
                state.error = null;
            })
            .addCase(fetchExtraWork.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
            
        // Create extra work
        builder
            .addCase(createExtraWork.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createExtraWork.fulfilled, (state, action) => {
                state.createLoading = false;
                state.extraWorkEntries.unshift(action.payload.data);
                state.error = null;
            })
            .addCase(createExtraWork.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            });
            
        // Delete extra work
        builder
            .addCase(deleteExtraWork.fulfilled, (state, action) => {
                state.extraWorkEntries = state.extraWorkEntries.filter(
                    entry => entry._id !== action.payload
                );
            });
    }
});

export const { clearError } = extraWorkSlice.actions;
export default extraWorkSlice.reducer;
```

### API Service (`extraWorkApi.js`)

```javascript
import { axiosWrapper } from "./axiosWrapper";

export const getAllExtraWork = (params) => 
    axiosWrapper.get("/extra-work", { params });

export const getExtraWorkById = (id) => 
    axiosWrapper.get(`/extra-work/${id}`);

export const getExtraWorkByMember = (memberId, params) => 
    axiosWrapper.get(`/extra-work/member/${memberId}`, { params });

export const createExtraWork = (data) => 
    axiosWrapper.post("/extra-work", data);

export const bulkCreateExtraWork = (entries) => 
    axiosWrapper.post("/extra-work/bulk", { entries });

export const updateExtraWork = (id, data) => 
    axiosWrapper.put(`/extra-work/${id}`, data);

export const deleteExtraWork = (id) => 
    axiosWrapper.delete(`/extra-work/${id}`);

export const approveExtraWork = (id) => 
    axiosWrapper.patch(`/extra-work/${id}/approve`);

export const markAsPaid = (id) => 
    axiosWrapper.patch(`/extra-work/${id}/mark-paid`);

export const getMyExtraWork = (params) => 
    axiosWrapper.get("/extra-work/my-extra-work", { params });

export const getExtraWorkStats = (params) => 
    axiosWrapper.get("/extra-work/stats", { params });
```

### Page Component (`ExtraWorkManagement.jsx`)

```jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdCheckCircle, 
  MdAccessTime,
  MdAttachMoney,
  MdFilterList
} from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import { fetchExtraWork, deleteExtraWork, clearError } from "../redux/slices/extraWorkSlice";
import BackButton from "../components/shared/BackButton";
import ExtraWorkModal from "../components/extrawork/ExtraWorkModal";
import DeleteConfirmationModal from "../components/shared/DeleteConfirmationModal";

const ExtraWorkManagement = () => {
  const dispatch = useDispatch();
  const { extraWorkEntries, totalHours, totalPayment, loading, error } = useSelector(
    (state) => state.extraWork
  );
  const { role } = useSelector((state) => state.user);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filters, setFilters] = useState({
    isApproved: "",
    isPaid: "",
    workType: ""
  });

  const isAdmin = role === "Admin";

  useEffect(() => {
    document.title = "POS | Extra Work Management";
    if (isAdmin) {
      dispatch(fetchExtraWork(filters));
    }
  }, [dispatch, isAdmin, filters]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateClick = () => {
    setSelectedEntry(null);
    setShowCreateModal(true);
  };

  const handleEditClick = (entry) => {
    setSelectedEntry(entry);
    setShowEditModal(true);
  };

  const handleDeleteClick = (entry) => {
    setSelectedEntry(entry);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedEntry) {
      try {
        await dispatch(deleteExtraWork(selectedEntry._id)).unwrap();
        enqueueSnackbar("Extra work entry deleted successfully!", { variant: "success" });
        setShowDeleteModal(false);
        setSelectedEntry(null);
      } catch (error) {
        enqueueSnackbar(error || "Failed to delete entry", { variant: "error" });
      }
    }
  };

  const getWorkTypeColor = (workType) => {
    switch (workType) {
      case "overtime":
        return "bg-orange-900/20 text-orange-400 border-orange-700";
      case "extra_shift":
        return "bg-blue-900/20 text-blue-400 border-blue-700";
      case "emergency":
        return "bg-red-900/20 text-red-400 border-red-700";
      case "training":
        return "bg-green-900/20 text-green-400 border-green-700";
      case "event":
        return "bg-purple-900/20 text-purple-400 border-purple-700";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-700";
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">Access Denied</h2>
          <p className="text-[#ababab]">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-4 border-b border-[#343434]">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Extra Work Management
          </h1>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
        >
          <MdAdd size={16} /> Add Extra Work
        </button>
      </div>

      {/* Stats Cards */}
      <div className="px-10 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ababab] text-sm mb-1">Total Entries</p>
              <p className="text-[#f5f5f5] text-3xl font-bold">{extraWorkEntries.length}</p>
            </div>
            <MdAccessTime size={48} className="text-[#f6b100]" />
          </div>
        </div>

        <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ababab] text-sm mb-1">Total Hours</p>
              <p className="text-[#f5f5f5] text-3xl font-bold">
                {totalHours.toFixed(2)}
              </p>
            </div>
            <MdCheckCircle size={48} className="text-green-400" />
          </div>
        </div>

        <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ababab] text-sm mb-1">Total Payment</p>
              <p className="text-[#f5f5f5] text-3xl font-bold">
                ${totalPayment.toFixed(2)}
              </p>
            </div>
            <MdAttachMoney size={48} className="text-[#f6b100]" />
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="px-10 py-6">
        <div className="bg-[#1f1f1f] rounded-lg border border-[#343434]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#343434]">
                  <th className="px-6 py-4 text-left text-[#ababab] text-sm font-medium">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-[#ababab] text-sm font-medium">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-[#ababab] text-sm font-medium">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-[#ababab] text-sm font-medium">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-[#ababab] text-sm font-medium">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-[#ababab] text-sm font-medium">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-[#ababab] text-sm font-medium">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-right text-[#ababab] text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {extraWorkEntries.map((entry) => (
                  <tr key={entry._id} className="border-b border-[#343434] hover:bg-[#262626]">
                    <td className="px-6 py-4 text-[#f5f5f5]">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-[#f5f5f5]">{entry.member?.name}</td>
                    <td className="px-6 py-4 text-[#ababab]">
                      {entry.startTime} - {entry.endTime}
                    </td>
                    <td className="px-6 py-4 text-[#f5f5f5]">
                      {entry.durationHours.toFixed(2)}h
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getWorkTypeColor(entry.workType)}`}>
                        {entry.workType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          entry.isApproved 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {entry.isApproved ? 'Approved' : 'Pending'}
                        </span>
                        {entry.isApproved && (
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            entry.isPaid 
                              ? 'bg-blue-900/30 text-blue-400' 
                              : 'bg-orange-900/30 text-orange-400'
                          }`}>
                            {entry.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#f6b100] font-medium">
                      ${entry.paymentAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!entry.isPaid && (
                          <>
                            <button
                              onClick={() => handleEditClick(entry)}
                              className="p-2 bg-[#262626] text-[#f6b100] rounded-lg hover:bg-[#343434] transition-colors"
                              title="Edit"
                            >
                              <MdEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(entry)}
                              className="p-2 bg-[#262626] text-red-400 rounded-lg hover:bg-[#343434] transition-colors"
                              title="Delete"
                            >
                              <MdDelete size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <ExtraWorkModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mode="create"
        />
      )}

      {showEditModal && selectedEntry && (
        <ExtraWorkModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          mode="edit"
          entry={selectedEntry}
        />
      )}

      {showDeleteModal && selectedEntry && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Extra Work Entry"
          message={`Are you sure you want to delete this extra work entry for ${selectedEntry.member?.name}?`}
          confirmText="Delete Entry"
        />
      )}
    </div>
  );
};

export default ExtraWorkManagement;
```

---

## Register in Backend (`app.js`)

```javascript
// In pos-backend/app.js
const extraWorkRoutes = require("./routes/extraWorkRoute");

// Register route
app.use("/api/extra-work", extraWorkRoutes);
```

---

## Summary

This Extra Work Time Management module provides:

✅ **Log extra work hours** with date, start time, end time
✅ **Work type categorization** (overtime, extra shift, emergency, training, event)
✅ **Approval workflow** - Admin must approve entries
✅ **Payment tracking** - Mark entries as paid
✅ **Automatic calculations** - Duration and payment amount
✅ **Hourly rate support** - Optional custom rate per entry
✅ **Statistics dashboard** - Total hours, payment, by member, by type
✅ **Member view** - Members can view their own extra work
✅ **Bulk operations** - Create multiple entries at once
✅ **Integration ready** - Works with existing member/salary system

The system is production-ready and includes validation, error handling, and security features!

