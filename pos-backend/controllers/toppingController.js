const Topping = require("../models/toppingModel");
const createHttpError = require("http-errors");
const { default: mongoose } = require("mongoose");

// Get all toppings
const getAllToppings = async (req, res, next) => {
  try {
    const { category, available, sort = 'name' } = req.query;
    
    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';
    
    // Build sort object
    let sortObj = {};
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
    
    const topping = await Topping.findById(toppingId);
    
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
    const toppings = await Topping.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    
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
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingTopping) {
      const error = createHttpError(409, "Topping with this name already exists");
      return next(error);
    }
    
    const toppingData = {
      name: name.trim(),
      description: description?.trim() || '',
      price,
      category
    };
    
    const topping = new Topping(toppingData);
    await topping.save();
    
    res.status(201).json({
      success: true,
      message: "Topping created successfully",
      data: topping
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
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
    const existingTopping = await Topping.findById(toppingId);
    if (!existingTopping) {
      const error = createHttpError(404, "Topping not found");
      return next(error);
    }
    
    // If updating name, check for duplicates
    if (updateData.name && updateData.name.trim() !== existingTopping.name) {
      const duplicateTopping = await Topping.findOne({
        name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
        _id: { $ne: toppingId }
      });
      
      if (duplicateTopping) {
        const error = createHttpError(409, "Topping with this name already exists");
        return next(error);
      }
    }
    
    // Clean and validate update data
    const cleanUpdateData = {};
    
    if (updateData.name) cleanUpdateData.name = updateData.name.trim();
    if (updateData.description !== undefined) cleanUpdateData.description = updateData.description.trim();
    if (updateData.price !== undefined) cleanUpdateData.price = updateData.price;
    if (updateData.category) cleanUpdateData.category = updateData.category;
    if (updateData.isAvailable !== undefined) cleanUpdateData.isAvailable = updateData.isAvailable;
    
    const updatedTopping = await Topping.findByIdAndUpdate(
      toppingId,
      cleanUpdateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Topping updated successfully",
      data: updatedTopping
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
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
    
    const topping = await Topping.findById(toppingId);
    if (!topping) {
      const error = createHttpError(404, "Topping not found");
      return next(error);
    }
    
    await Topping.findByIdAndDelete(toppingId);
    
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
    
    const topping = await Topping.findById(toppingId);
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

module.exports = {
  getAllToppings,
  getToppingById,
  getToppingsByCategory,
  createTopping,
  updateTopping,
  deleteTopping,
  toggleToppingAvailability
};
