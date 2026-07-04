import type { MongoFilter } from "../types/mongo.js";

import createHttpError from "http-errors";
import mongoose from "mongoose";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import Schedule from "../models/scheduleModel.js";
import { userRoles } from "../constants/user.js";

const storeIdOf = (storeRef: unknown): string | null => {
    if (!storeRef) return null;
    if (typeof storeRef === "object" && storeRef !== null && "_id" in storeRef) {
        return String((storeRef as { _id: unknown })._id);
    }
    return String(storeRef);
};

const buildStoreFilter = (req): MongoFilter => {
    if (req.store?._id) {
        return { store: req.store._id };
    }
    return {};
};

const verifyTemplateAccess = (template, req, next): boolean => {
    if (req.user.role === userRoles.ADMIN) {
        return true;
    }
    const templateStoreId = storeIdOf(template.store);
    const requestStoreId = storeIdOf(req.store?._id);
    if (!templateStoreId || templateStoreId !== requestStoreId) {
        next(createHttpError(404, "Shift template not found"));
        return false;
    }
    return true;
};

// Get shift templates for the selected store (admin without store header sees all stores)
const getAllShiftTemplates = async (req, res, next) => {
    try {
        const { isActive } = req.query;

        const query: MongoFilter = buildStoreFilter(req);
        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const templates = await ShiftTemplate.find(query)
            .populate("store", "name")
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

// Get active shift templates for the selected store (admin without store header sees all stores)
const getActiveShiftTemplates = async (req, res, next) => {
    try {
        const query: MongoFilter = { isActive: true, ...buildStoreFilter(req) };

        const templates = await ShiftTemplate.find(query)
            .populate("store", "name")
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

const getShiftTemplateById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return next(createHttpError(400, "Shift template ID is required"));
        }

        const template = await ShiftTemplate.findById(id).populate("store", "name");
        if (!template) {
            return next(createHttpError(404, "Shift template not found"));
        }
        if (!verifyTemplateAccess(template, req, next)) return;

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (error) {
        next(error);
    }
};

const createShiftTemplate = async (req, res, next) => {
    try {
        const { name, shortName, startTime, endTime, color, description } = req.body;

        if (!req.store?._id) {
            return next(createHttpError(400, "Store selection required. Please select a store."));
        }

        if (!name || !shortName || !startTime || !endTime) {
            return next(createHttpError(400, "Name, short name, start time, and end time are required"));
        }

        const existingTemplate = await ShiftTemplate.findOne({ store: req.store._id, name });
        if (existingTemplate) {
            return next(createHttpError(400, "Shift template with this name already exists for this store"));
        }

        const template = new ShiftTemplate({
            store: req.store._id,
            name,
            shortName: shortName.toUpperCase(),
            startTime,
            endTime,
            color: color || "#f6b100",
            description: description || ""
        });

        await template.save();
        await template.populate("store", "name");

        res.status(201).json({
            success: true,
            message: "Shift template created successfully",
            data: template
        });
    } catch (error) {
        next(error);
    }
};

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
        if (!verifyTemplateAccess(template, req, next)) return;

        if (name && name !== template.name) {
            const existingTemplate = await ShiftTemplate.findOne({
                store: template.store,
                name,
                _id: { $ne: id }
            });
            if (existingTemplate) {
                return next(createHttpError(400, "Shift template with this name already exists for this store"));
            }
        }

        if (name) template.name = name;
        if (shortName) template.shortName = shortName.toUpperCase();
        if (startTime) template.startTime = startTime;
        if (endTime) template.endTime = endTime;
        if (color) template.color = color;
        if (description !== undefined) template.description = description;

        await template.save();
        await template.populate("store", "name");

        res.status(200).json({
            success: true,
            message: "Shift template updated successfully",
            data: template
        });
    } catch (error) {
        next(error);
    }
};

const deleteShiftTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Shift template ID is required"));
        }

        const template = await ShiftTemplate.findById(id);
        if (!template) {
            return next(createHttpError(404, "Shift template not found"));
        }
        if (!verifyTemplateAccess(template, req, next)) return;

        const refCount = await Schedule.countDocuments({ shiftTemplate: id });
        if (refCount > 0) {
            return next(
                createHttpError(
                    400,
                    `Cannot delete: ${refCount} schedule(s) reference this template. Deactivate it instead.`
                )
            );
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
        if (!verifyTemplateAccess(template, req, next)) return;

        template.isActive = !template.isActive;
        await template.save();
        await template.populate("store", "name");

        res.status(200).json({
            success: true,
            message: `Shift template ${template.isActive ? "activated" : "deactivated"} successfully`,
            data: template
        });
    } catch (error) {
        next(error);
    }
};

export {
    getAllShiftTemplates,
    getActiveShiftTemplates,
    getShiftTemplateById,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate,
    toggleActiveStatus
};
