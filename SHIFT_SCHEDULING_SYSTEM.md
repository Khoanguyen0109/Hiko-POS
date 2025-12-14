# Shift Scheduling System - Design Document

## Overview
A comprehensive shift scheduling system to manage member work schedules, allowing admins to define shift templates, assign members to shifts, and view schedules by week.

## System Requirements

### Core Features
1. **Shift Template Management** - Define reusable shift templates (Morning, Afternoon, Evening)
2. **Schedule Management** - Assign members to shifts for specific dates
3. **Weekly View** - View and manage schedules by week
4. **Multi-member Assignment** - Assign multiple members to a single shift
5. **Schedule History** - Track and log all shift assignments

---

## Database Models

### 1. Shift Template Model (`shiftTemplateModel.js`)

Defines reusable shift types with time ranges.

```javascript
const mongoose = require("mongoose");

const shiftTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Shift name is required"],
        unique: true,
        trim: true
        // e.g., "Morning Shift", "Afternoon Shift", "Evening Shift"
    },
    
    shortName: {
        type: String,
        required: true,
        trim: true
        // e.g., "MORNING", "AFTERNOON", "EVENING"
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
        // Format: "07:00", "12:30", "17:30"
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
        // Format: "12:30", "17:30", "22:30"
    },
    
    color: {
        type: String,
        default: "#f6b100"
        // Color code for UI display
    },
    
    description: {
        type: String,
        default: ""
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Calculated duration in hours
    durationHours: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate duration before saving
shiftTemplateSchema.pre('save', function(next) {
    if (this.startTime && this.endTime) {
        const [startHour, startMin] = this.startTime.split(':').map(Number);
        const [endHour, endMin] = this.endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        this.durationHours = (endMinutes - startMinutes) / 60;
    }
    next();
});

module.exports = mongoose.model("ShiftTemplate", shiftTemplateSchema);
```

### 2. Schedule Model (`scheduleModel.js`)

Assigns members to specific shifts on specific dates.

```javascript
const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, "Date is required"],
        index: true
    },
    
    shiftTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShiftTemplate",
        required: [true, "Shift template is required"]
    },
    
    assignedMembers: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["scheduled", "confirmed", "completed", "absent", "cancelled"],
            default: "scheduled"
        },
        notes: {
            type: String,
            default: ""
        },
        // Clock in/out times (actual work times)
        clockIn: {
            type: Date,
            default: null
        },
        clockOut: {
            type: Date,
            default: null
        }
    }],
    
    // Week information for easy querying
    weekNumber: {
        type: Number,
        required: true
    },
    
    year: {
        type: Number,
        required: true
    },
    
    notes: {
        type: String,
        default: ""
    },
    
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

// Compound index for efficient queries
scheduleSchema.index({ date: 1, shiftTemplate: 1 });
scheduleSchema.index({ year: 1, weekNumber: 1 });
scheduleSchema.index({ "assignedMembers.member": 1, date: 1 });

// Helper method to get week number
scheduleSchema.pre('save', function(next) {
    if (this.date) {
        const date = new Date(this.date);
        this.year = date.getFullYear();
        
        // Calculate week number (ISO 8601)
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        this.weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
    next();
});

module.exports = mongoose.model("Schedule", scheduleSchema);
```

### 3. Shift Swap Request Model (Optional - for future enhancement)

```javascript
const mongoose = require("mongoose");

const shiftSwapRequestSchema = new mongoose.Schema({
    schedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
        required: true
    },
    
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    requestedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null // null means open to anyone
    },
    
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "cancelled"],
        default: "pending"
    },
    
    reason: {
        type: String,
        required: true
    },
    
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
    approvedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model("ShiftSwapRequest", shiftSwapRequestSchema);
```

---

## API Endpoints

### Shift Template Endpoints

```javascript
// routes/shiftTemplateRoute.js

// Admin only
GET    /api/shift-template              - Get all shift templates
GET    /api/shift-template/active       - Get active shift templates only
GET    /api/shift-template/:id          - Get shift template by ID
POST   /api/shift-template              - Create new shift template
PUT    /api/shift-template/:id          - Update shift template
DELETE /api/shift-template/:id          - Delete shift template
PATCH  /api/shift-template/:id/toggle   - Toggle active status
```

### Schedule Endpoints

```javascript
// routes/scheduleRoute.js

// Admin routes
GET    /api/schedule                           - Get all schedules (with filters)
GET    /api/schedule/week/:year/:week          - Get schedules by week
GET    /api/schedule/date/:date                - Get schedules by specific date
GET    /api/schedule/member/:memberId          - Get schedules by member
GET    /api/schedule/range                     - Get schedules by date range
POST   /api/schedule                           - Create single schedule
POST   /api/schedule/bulk                      - Create multiple schedules (week)
PUT    /api/schedule/:id                       - Update schedule
DELETE /api/schedule/:id                       - Delete schedule
PATCH  /api/schedule/:id/assign                - Assign member to shift
PATCH  /api/schedule/:id/unassign              - Unassign member from shift
PATCH  /api/schedule/:id/status                - Update member status in shift

// Member routes (view own schedules)
GET    /api/schedule/my-schedule               - Get own schedules
GET    /api/schedule/my-schedule/week          - Get own schedules by week
PATCH  /api/schedule/:id/clock-in             - Clock in to shift
PATCH  /api/schedule/:id/clock-out            - Clock out from shift
```

---

## Controller Functions

### Shift Template Controller (`shiftTemplateController.js`)

```javascript
const ShiftTemplate = require("../models/shiftTemplateModel");
const createHttpError = require("http-errors");

// Get all shift templates
const getAllShiftTemplates = async (req, res, next) => {
    try {
        const templates = await ShiftTemplate.find().sort({ startTime: 1 });
        
        res.status(200).json({
            success: true,
            count: templates.length,
            data: templates
        });
    } catch (error) {
        next(error);
    }
};

// Get active shift templates only
const getActiveShiftTemplates = async (req, res, next) => {
    try {
        const templates = await ShiftTemplate.find({ isActive: true })
            .sort({ startTime: 1 });
        
        res.status(200).json({
            success: true,
            count: templates.length,
            data: templates
        });
    } catch (error) {
        next(error);
    }
};

// Create shift template
const createShiftTemplate = async (req, res, next) => {
    try {
        const { name, shortName, startTime, endTime, color, description } = req.body;
        
        // Validation
        if (!name || !shortName || !startTime || !endTime) {
            return next(createHttpError(400, "All required fields must be provided"));
        }
        
        // Check if template already exists
        const existingTemplate = await ShiftTemplate.findOne({ name });
        if (existingTemplate) {
            return next(createHttpError(400, "Shift template with this name already exists"));
        }
        
        const template = new ShiftTemplate({
            name,
            shortName,
            startTime,
            endTime,
            color,
            description
        });
        
        await template.save();
        
        res.status(201).json({
            success: true,
            message: "Shift template created successfully",
            data: template
        });
    } catch (error) {
        next(error);
    }
};

// Update shift template
const updateShiftTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, shortName, startTime, endTime, color, description } = req.body;
        
        const template = await ShiftTemplate.findById(id);
        if (!template) {
            return next(createHttpError(404, "Shift template not found"));
        }
        
        // Update fields
        if (name) template.name = name;
        if (shortName) template.shortName = shortName;
        if (startTime) template.startTime = startTime;
        if (endTime) template.endTime = endTime;
        if (color) template.color = color;
        if (description !== undefined) template.description = description;
        
        await template.save();
        
        res.status(200).json({
            success: true,
            message: "Shift template updated successfully",
            data: template
        });
    } catch (error) {
        next(error);
    }
};

// Delete shift template
const deleteShiftTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const template = await ShiftTemplate.findById(id);
        if (!template) {
            return next(createHttpError(404, "Shift template not found"));
        }
        
        await ShiftTemplate.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Shift template deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllShiftTemplates,
    getActiveShiftTemplates,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate
};
```

### Schedule Controller (`scheduleController.js`)

```javascript
const Schedule = require("../models/scheduleModel");
const ShiftTemplate = require("../models/shiftTemplateModel");
const User = require("../models/userModel");
const createHttpError = require("http-errors");

// Get schedules by week
const getSchedulesByWeek = async (req, res, next) => {
    try {
        const { year, week } = req.params;
        
        const schedules = await Schedule.find({
            year: parseInt(year),
            weekNumber: parseInt(week)
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

// Get schedules by date
const getSchedulesByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        
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

// Create single schedule
const createSchedule = async (req, res, next) => {
    try {
        const { date, shiftTemplateId, memberIds, notes } = req.body;
        
        if (!date || !shiftTemplateId) {
            return next(createHttpError(400, "Date and shift template are required"));
        }
        
        // Verify shift template exists
        const shiftTemplate = await ShiftTemplate.findById(shiftTemplateId);
        if (!shiftTemplate) {
            return next(createHttpError(404, "Shift template not found"));
        }
        
        // Check if schedule already exists
        const existingSchedule = await Schedule.findOne({
            date: new Date(date),
            shiftTemplate: shiftTemplateId
        });
        
        if (existingSchedule) {
            return next(createHttpError(400, "Schedule already exists for this shift on this date"));
        }
        
        // Prepare assigned members
        const assignedMembers = [];
        if (memberIds && memberIds.length > 0) {
            for (const memberId of memberIds) {
                const member = await User.findById(memberId);
                if (member) {
                    assignedMembers.push({
                        member: memberId,
                        status: "scheduled"
                    });
                }
            }
        }
        
        const schedule = new Schedule({
            date: new Date(date),
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
        
        res.status(201).json({
            success: true,
            message: "Schedule created successfully",
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Bulk create schedules for a week
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
                
                // Check if schedule already exists
                const existingSchedule = await Schedule.findOne({
                    date: new Date(date),
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
                if (memberIds && memberIds.length > 0) {
                    for (const memberId of memberIds) {
                        assignedMembers.push({
                            member: memberId,
                            status: "scheduled"
                        });
                    }
                }
                
                const schedule = new Schedule({
                    date: new Date(date),
                    shiftTemplate: shiftTemplateId,
                    assignedMembers,
                    notes: notes || "",
                    createdBy: req.user._id
                });
                
                await schedule.save();
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
            data: createdSchedules,
            errors: errors.length > 0 ? errors : undefined
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
        
        if (!memberId) {
            return next(createHttpError(400, "Member ID is required"));
        }
        
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return next(createHttpError(404, "Schedule not found"));
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
        
        if (!memberId) {
            return next(createHttpError(400, "Member ID is required"));
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

// Get member's own schedules
const getMySchedules = async (req, res, next) => {
    try {
        const memberId = req.user._id;
        const { startDate, endDate } = req.query;
        
        const query = {
            "assignedMembers.member": memberId
        };
        
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const schedules = await Schedule.find(query)
            .populate('shiftTemplate')
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
    getSchedulesByWeek,
    getSchedulesByDate,
    createSchedule,
    bulkCreateSchedules,
    assignMemberToShift,
    unassignMemberFromShift,
    getMySchedules
};
```

---

## Frontend Components Structure

### Pages

```
src/pages/
├── ShiftTemplates.jsx          - Manage shift templates (Admin)
├── WeeklySchedule.jsx          - Weekly schedule view/management (Admin)
├── MySchedule.jsx              - Member's personal schedule view
└── ScheduleCalendar.jsx        - Calendar view of all schedules (Admin)
```

### Components

```
src/components/schedule/
├── ShiftTemplateCard.jsx       - Display shift template
├── ShiftTemplateModal.jsx      - Create/Edit shift template
├── WeeklyScheduleGrid.jsx      - Grid view of weekly schedule
├── ScheduleCard.jsx            - Individual schedule card
├── ScheduleModal.jsx           - Create/Edit schedule
├── MemberAssignmentModal.jsx   - Assign members to shift
├── WeekNavigator.jsx           - Navigate between weeks
└── ShiftTimeline.jsx           - Timeline view of shifts
```

### Redux Slices

```
src/redux/slices/
├── shiftTemplateSlice.js       - Shift template state management
└── scheduleSlice.js            - Schedule state management
```

---

## UI Design Suggestions

### 1. Weekly Schedule View (Grid Layout)

```
┌─────────────────────────────────────────────────────────────┐
│  Week Navigation:  [ < ] Week 45 (Nov 11-17, 2024) [ > ]   │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┤
│  Mon    │  Tue    │  Wed    │  Thu    │  Fri    │  Sat    │
│  11/11  │  11/12  │  11/13  │  11/14  │  11/15  │  11/16  │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 🌅      │ 🌅      │ 🌅      │ 🌅      │ 🌅      │ 🌅      │
│ Morning │ Morning │ Morning │ Morning │ Morning │ Morning │
│ 7-12:30 │ 7-12:30 │ 7-12:30 │ 7-12:30 │ 7-12:30 │ 7-12:30 │
│ ────────│─────────│─────────│─────────│─────────│─────────│
│ 👤 John │ 👤 Jane │ 👤 John │ 👤 Mike │ 👤 John │ 👤 Sara │
│ 👤 Mike │ 👤 Sara │ 👤 Lisa │ 👤 Lisa │ 👤 Jane │         │
│ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ ☀️      │ ☀️      │ ☀️      │ ☀️      │ ☀️      │ ☀️      │
│Afternoon│Afternoon│Afternoon│Afternoon│Afternoon│Afternoon│
│12:30-17 │12:30-17 │12:30-17 │12:30-17 │12:30-17 │12:30-17 │
│ ────────│─────────│─────────│─────────│─────────│─────────│
│ 👤 Sara │ 👤 Mike │ 👤 Sara │ 👤 John │ 👤 Mike │ 👤 John │
│ 👤 Lisa │ 👤 John │ 👤 Mike │ 👤 Sara │ 👤 Lisa │         │
│ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 🌙      │ 🌙      │ 🌙      │ 🌙      │ 🌙      │ 🌙      │
│ Evening │ Evening │ Evening │ Evening │ Evening │ Evening │
│17:30-22 │17:30-22 │17:30-22 │17:30-22 │17:30-22 │17:30-22 │
│ ────────│─────────│─────────│─────────│─────────│─────────│
│ 👤 Lisa │ 👤 Lisa │ 👤 Jane │ 👤 Jane │ 👤 Sara │ 👤 Mike │
│ 👤 Jane │ 👤 John │ 👤 John │ 👤 Mike │ 👤 John │         │
│ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### 2. Shift Templates Management

```
┌───────────────────────────────────────────────────────┐
│  Shift Templates                     [+ Add Template] │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🌅 Morning Shift                             │    │
│  │ ⏰ 07:00 - 12:30 (5.5 hours)                 │    │
│  │ 📝 Early morning operations                  │    │
│  │ Status: ✅ Active                            │    │
│  │                          [Edit] [Delete]     │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ ☀️ Afternoon Shift                           │    │
│  │ ⏰ 12:30 - 17:30 (5 hours)                   │    │
│  │ 📝 Lunch and afternoon service               │    │
│  │ Status: ✅ Active                            │    │
│  │                          [Edit] [Delete]     │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🌙 Evening Shift                             │    │
│  │ ⏰ 17:30 - 22:30 (5 hours)                   │    │
│  │ 📝 Dinner service and closing               │    │
│  │ Status: ✅ Active                            │    │
│  │                          [Edit] [Delete]     │    │
│  └──────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

### 3. Member Assignment Modal

```
┌─────────────────────────────────────────────┐
│  Assign Members to Shift                    │
│                                              │
│  Date: Monday, Nov 11, 2024                 │
│  Shift: 🌅 Morning Shift (7:00 - 12:30)    │
│                                              │
│  ────────────────────────────────────────   │
│                                              │
│  Select Members:                             │
│                                              │
│  [✓] 👤 John Doe       (User)               │
│  [✓] 👤 Jane Smith     (User)               │
│  [ ] 👤 Mike Johnson   (User)               │
│  [ ] 👤 Sara Williams  (User)               │
│  [✓] 👤 Lisa Brown     (User)               │
│                                              │
│  Notes (Optional):                           │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│            [Cancel]  [Save Assignment]       │
└─────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Backend Foundation
1. ✅ Create Shift Template Model
2. ✅ Create Schedule Model
3. ✅ Create Shift Template Controller
4. ✅ Create Schedule Controller
5. ✅ Create Routes
6. ✅ Add Middleware Protection

### Phase 2: Frontend Foundation
1. Create Redux Slices
2. Create API Service Functions
3. Create Basic Page Layouts

### Phase 3: Shift Template Management
1. Create Shift Template List Page
2. Create Shift Template Modal
3. Implement CRUD Operations

### Phase 4: Schedule Management
1. Create Weekly Schedule Grid Component
2. Create Schedule Modal
3. Create Member Assignment Modal
4. Implement Week Navigation

### Phase 5: Member Features
1. Create My Schedule Page
2. Implement Clock In/Out
3. Add Notifications

### Phase 6: Advanced Features
1. Schedule Conflict Detection
2. Shift Swap Requests
3. Schedule Templates (copy week)
4. Export to PDF/Excel
5. Analytics Dashboard

---

## Additional Features to Consider

### 1. Conflict Detection
- Prevent double-booking members
- Warn if member has back-to-back shifts
- Check member availability

### 2. Notifications
- Email/Push notifications for new assignments
- Reminders before shift starts
- Schedule change notifications

### 3. Reporting
- Hours worked per member
- Shift coverage statistics
- Member attendance reports
- Labor cost calculations (based on salary)

### 4. Shift Preferences
- Members can set preferred shifts
- Availability calendar
- Time-off requests

### 5. Auto-scheduling (AI)
- Suggest optimal member assignments
- Balance workload across members
- Respect preferences and constraints

---

## Database Queries Examples

### Get all schedules for a specific week
```javascript
const schedules = await Schedule.find({
    year: 2024,
    weekNumber: 45
})
.populate('shiftTemplate')
.populate('assignedMembers.member', 'name email role')
.sort({ date: 1 });
```

### Get member's schedules for current month
```javascript
const startOfMonth = new Date(2024, 10, 1);
const endOfMonth = new Date(2024, 10, 30);

const schedules = await Schedule.find({
    'assignedMembers.member': memberId,
    date: { $gte: startOfMonth, $lte: endOfMonth }
})
.populate('shiftTemplate')
.sort({ date: 1 });
```

### Get all members working on a specific date
```javascript
const schedules = await Schedule.find({
    date: new Date('2024-11-11')
})
.populate('assignedMembers.member', 'name phone')
.populate('shiftTemplate');
```

---

## Security Considerations

1. **Authorization**
   - Only Admin can create/edit schedules
   - Members can only view their own schedules
   - Protect sensitive member information

2. **Validation**
   - Validate date ranges
   - Validate time formats
   - Prevent invalid assignments

3. **Audit Trail**
   - Track who created schedules
   - Track who modified schedules
   - Log all schedule changes

---

## Performance Optimization

1. **Database Indexing**
   - Index on date field
   - Index on year + weekNumber
   - Index on member ID

2. **Caching**
   - Cache shift templates
   - Cache current week schedules
   - Invalidate cache on updates

3. **Pagination**
   - Paginate historical schedules
   - Load current week by default
   - Lazy load older data

---

This design provides a comprehensive shift scheduling system that can be extended with additional features as needed. Would you like me to start implementing any specific part of this system?

