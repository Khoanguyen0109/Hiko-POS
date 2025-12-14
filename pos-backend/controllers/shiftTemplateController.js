const createHttpError = require("http-errors");
const ShiftTemplate = require("../models/shiftTemplateModel");

// Get all shift templates
const getAllShiftTemplates = async (req, res, next) => {
    try {
        const { isActive } = req.query;
        
        const query = {};
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        
        const templates = await ShiftTemplate.find(query).sort({ startTime: 1 });
        
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

// Get shift template by ID
const getShiftTemplateById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return next(createHttpError(400, "Shift template ID is required"));
        }
        
        const template = await ShiftTemplate.findById(id);
        
        if (!template) {
            return next(createHttpError(404, "Shift template not found"));
        }
        
        res.status(200).json({
            success: true,
            data: template
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
            return next(createHttpError(400, "Name, short name, start time, and end time are required"));
        }
        
        // Check if template already exists
        const existingTemplate = await ShiftTemplate.findOne({ name });
        if (existingTemplate) {
            return next(createHttpError(400, "Shift template with this name already exists"));
        }
        
        const template = new ShiftTemplate({
            name,
            shortName: shortName.toUpperCase(),
            startTime,
            endTime,
            color: color || "#f6b100",
            description: description || ""
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
        
        if (!id) {
            return next(createHttpError(400, "Shift template ID is required"));
        }
        
        const template = await ShiftTemplate.findById(id);
        if (!template) {
            return next(createHttpError(404, "Shift template not found"));
        }
        
        // Check if new name already exists (excluding current template)
        if (name && name !== template.name) {
            const existingTemplate = await ShiftTemplate.findOne({ 
                name, 
                _id: { $ne: id } 
            });
            if (existingTemplate) {
                return next(createHttpError(400, "Shift template with this name already exists"));
            }
        }
        
        // Update fields
        if (name) template.name = name;
        if (shortName) template.shortName = shortName.toUpperCase();
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
        
        if (!id) {
            return next(createHttpError(400, "Shift template ID is required"));
        }
        
        const template = await ShiftTemplate.findById(id);
        if (!template) {
            return next(createHttpError(404, "Shift template not found"));
        }
        
        // Note: In production, you might want to check if this template is used in any schedules
        // and prevent deletion or cascade delete
        
        await ShiftTemplate.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Shift template deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Toggle active status
const toggleActiveStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return next(createHttpError(400, "Shift template ID is required"));
        }
        
        const template = await ShiftTemplate.findById(id);
        if (!template) {
            return next(createHttpError(404, "Shift template not found"));
        }
        
        template.isActive = !template.isActive;
        await template.save();
        
        res.status(200).json({
            success: true,
            message: `Shift template ${template.isActive ? 'activated' : 'deactivated'} successfully`,
            data: template
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllShiftTemplates,
    getActiveShiftTemplates,
    getShiftTemplateById,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate,
    toggleActiveStatus
};

