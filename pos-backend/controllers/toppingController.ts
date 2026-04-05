// @ts-nocheck
import type { MongoFilter } from "../types/mongo.js";
import type { ToppingUpdatePayload } from "../types/topping.js";
import {
  isMongooseValidationError,
  mongooseValidationMessages,
} from "../utils/mongooseValidation.js";

import Topping from "../models/toppingModel.js";
import createHttpError from "http-errors";
import mongoose from "mongoose";

// Get all toppings
const getAllToppings = async (req, res, next) => {
  try {
    const { category, available, sort = 'name' } = req.query;
    
    // Build filter object
    const filter: MongoFilter = {};
    const storeId = req.query.store || (req.store && req.store._id);
    if (storeId) filter.store = storeId;
    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';
    
    // Build sort object
    let sortObj: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'price':
        sortObj = { price: 1 };
        break;
      case 'category':
        sortObj = { category: 1, name: 1 };
        break;
      case 'name':
      default:
        sortObj = { name: 1 };
        break;
    }
    
    const toppings = await Topping.find(filter).sort(sortObj);
    
    res.status(200).json({
      success: true,
      message: "Toppings retrieved successfully",
      data: toppings
    });
  } catch (error) {
    next(error);
  }
};

// Get topping by ID
const getToppingById = async (req, res, next) => {
  try {
    const { toppingId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(toppingId)) {
      const error = createHttpError(400, "Invalid topping ID");
      return next(error);
    }
    
    const topping = await Topping.findOne({ _id: toppingId, store: req.store._id });
    
    if (!topping) {
      const error = createHttpError(404, "Topping not found");
      return next(error);
    }
    
    res.status(200).json({
      success: true,
      message: "Topping retrieved successfully",
      data: topping
    });
  } catch (error) {
    next(error);
  }
};

// Get available toppings grouped by category
const getToppingsByCategory = async (req, res, next) => {
  try {
    const categoryFilter: MongoFilter = { isAvailable: true };
    const categoryStoreId = req.query.store || (req.store && req.store._id);
    if (categoryStoreId) categoryFilter.store = categoryStoreId;
    const toppings = await Topping.find(categoryFilter).sort({ category: 1, name: 1 });
    
    // Group toppings by category
    const groupedToppings = toppings.reduce((acc, topping) => {
      if (!acc[topping.category]) {
        acc[topping.category] = [];
      }
      acc[topping.category].push(topping);
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      message: "Toppings grouped by category retrieved successfully",
      data: groupedToppings
    });
  } catch (error) {
    next(error);
  }
};

// Create new topping
const createTopping = async (req, res, next) => {
  try {
    const { name, description, price, category } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const error = createHttpError(400, "Topping name is required");
      return next(error);
    }
    
    if (!price || typeof price !== 'number' || price < 0) {
      const error = createHttpError(400, "Valid topping price is required");
      return next(error);
    }
    
    if (!category) {
      const error = createHttpError(400, "Topping category is required");
      return next(error);
    }
    
    // Check if topping with same name already exists
    const existingTopping = await Topping.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      store: req.store._id
    });
    
    if (existingTopping) {
      const error = createHttpError(409, "Topping with this name already exists");
      return next(error);
    }
    
    const toppingData = {
      name: name.trim(),
      description: description?.trim() || '',
      price,
      category,
      store: req.store._id
    };
    
    const topping = new Topping(toppingData);
    await topping.save();
    
    res.status(201).json({
      success: true,
      message: "Topping created successfully",
      data: topping
    });
  } catch (error: unknown) {
    if (isMongooseValidationError(error)) {
      const validationErrors = mongooseValidationMessages(error);
      const error400 = createHttpError(400, `Validation Error: ${validationErrors.join(', ')}`);
      return next(error400);
    }
    next(error);
  }
};

// Update topping
const updateTopping = async (req, res, next) => {
  try {
    const { toppingId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(toppingId)) {
      const error = createHttpError(400, "Invalid topping ID");
      return next(error);
    }
    
    // Check if topping exists
    const existingTopping = await Topping.findOne({ _id: toppingId, store: req.store._id });
    if (!existingTopping) {
      const error = createHttpError(404, "Topping not found");
      return next(error);
    }
    
    // If updating name, check for duplicates
    if (updateData.name && updateData.name.trim() !== existingTopping.name) {
      const duplicateTopping = await Topping.findOne({
        name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
        _id: { $ne: toppingId },
        store: req.store._id
      });
      
      if (duplicateTopping) {
        const error = createHttpError(409, "Topping with this name already exists");
        return next(error);
      }
    }
    
    // Clean and validate update data
    const cleanUpdateData: ToppingUpdatePayload = {};
    
    if (updateData.name) cleanUpdateData.name = updateData.name.trim();
    if (updateData.description !== undefined) cleanUpdateData.description = updateData.description.trim();
    if (updateData.price !== undefined) cleanUpdateData.price = updateData.price;
    if (updateData.category) cleanUpdateData.category = updateData.category;
    if (updateData.isAvailable !== undefined) cleanUpdateData.isAvailable = updateData.isAvailable;
    
    const updatedTopping = await Topping.findOneAndUpdate(
      { _id: toppingId, store: req.store._id },
      cleanUpdateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Topping updated successfully",
      data: updatedTopping
    });
  } catch (error: unknown) {
    if (isMongooseValidationError(error)) {
      const validationErrors = mongooseValidationMessages(error);
      const error400 = createHttpError(400, `Validation Error: ${validationErrors.join(', ')}`);
      return next(error400);
    }
    next(error);
  }
};

// Delete topping
const deleteTopping = async (req, res, next) => {
  try {
    const { toppingId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(toppingId)) {
      const error = createHttpError(400, "Invalid topping ID");
      return next(error);
    }
    
    const topping = await Topping.findOne({ _id: toppingId, store: req.store._id });
    if (!topping) {
      const error = createHttpError(404, "Topping not found");
      return next(error);
    }
    
    await Topping.findOneAndDelete({ _id: toppingId, store: req.store._id });
    
    res.status(200).json({
      success: true,
      message: "Topping deleted successfully",
      data: topping
    });
  } catch (error) {
    next(error);
  }
};

// Toggle topping availability
const toggleToppingAvailability = async (req, res, next) => {
  try {
    const { toppingId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(toppingId)) {
      const error = createHttpError(400, "Invalid topping ID");
      return next(error);
    }
    
    const topping = await Topping.findOne({ _id: toppingId, store: req.store._id });
    if (!topping) {
      const error = createHttpError(404, "Topping not found");
      return next(error);
    }
    
    topping.isAvailable = !topping.isAvailable;
    await topping.save();
    
    res.status(200).json({
      success: true,
      message: `Topping ${topping.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: topping
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAllToppings,
  getToppingById,
  getToppingsByCategory,
  createTopping,
  updateTopping,
  deleteTopping,
  toggleToppingAvailability
};