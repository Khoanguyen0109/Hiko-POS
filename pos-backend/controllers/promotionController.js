const createHttpError = require("http-errors");
const Promotion = require("../models/promotionModel");
const Dish = require("../models/dishModel");
const Category = require("../models/categoryModel");
const { default: mongoose } = require("mongoose");
const { getCurrentVietnamTime } = require("../utils/dateUtils");

// Create a new promotion
const createPromotion = async (req, res, next) => {
  try {
    const { _id: userId, name: userName } = req.user || {};
    const promotionData = req.body;

    // Validate required fields
    if (!promotionData.name || !promotionData.type) {
      const error = createHttpError(400, "Name and type are required");
      return next(error);
    }

    // Validate discount configuration based on type
    if (promotionData.type.includes('percentage')) {
      if (!promotionData.discount?.percentage || promotionData.discount.percentage <= 0) {
        const error = createHttpError(400, "Valid percentage is required for percentage-based promotions");
        return next(error);
      }
    }

    if (promotionData.type.includes('fixed')) {
      if (!promotionData.discount?.fixedAmount || promotionData.discount.fixedAmount <= 0) {
        const error = createHttpError(400, "Valid fixed amount is required for fixed-amount promotions");
        return next(error);
      }
    }

    // Validate Happy Hour discount type and values
    if (promotionData.type === 'happy_hour') {
      if (!promotionData.discountType) {
        const error = createHttpError(400, "Discount type is required for Happy Hour promotions");
        return next(error);
      }

      if (promotionData.discountType === 'percentage') {
        if (!promotionData.discount?.percentage || promotionData.discount.percentage <= 0 || promotionData.discount.percentage > 100) {
          const error = createHttpError(400, "Valid percentage (1-100) is required for percentage-based Happy Hour promotions");
          return next(error);
        }
      } else if (promotionData.discountType === 'fixed_amount') {
        if (!promotionData.discount?.fixedAmount || promotionData.discount.fixedAmount <= 0) {
          const error = createHttpError(400, "Valid fixed amount is required for fixed-amount Happy Hour promotions");
          return next(error);
        }
      } else if (promotionData.discountType === 'uniform_price') {
        if (!promotionData.discount?.uniformPrice || promotionData.discount.uniformPrice <= 0) {
          const error = createHttpError(400, "Valid uniform price is required for uniform pricing Happy Hour promotions");
          return next(error);
        }
      }
    }

    // Validate date range
    const startDate = new Date(promotionData.startDate);
    const endDate = new Date(promotionData.endDate);
    
    if (endDate <= startDate) {
      const error = createHttpError(400, "End date must be after start date");
      return next(error);
    }

    // Validate specific dishes if provided
    if (promotionData.applicableItems === 'specific_dishes' && promotionData.specificDishes?.length > 0) {
      const dishIds = promotionData.specificDishes.filter(id => mongoose.Types.ObjectId.isValid(id));
      const existingDishes = await Dish.find({ _id: { $in: dishIds } });
      
      if (existingDishes.length !== dishIds.length) {
        const error = createHttpError(400, "Some specified dishes do not exist");
        return next(error);
      }
    }

    // Validate categories if provided
    if (promotionData.applicableItems === 'categories' && promotionData.categories?.length > 0) {
      const categoryIds = promotionData.categories.filter(id => mongoose.Types.ObjectId.isValid(id));
      const existingCategories = await Category.find({ _id: { $in: categoryIds } });
      
      if (existingCategories.length !== categoryIds.length) {
        const error = createHttpError(400, "Some specified categories do not exist");
        return next(error);
      }
    }

    // Check for duplicate code if provided
    if (promotionData.code) {
      const existingPromotion = await Promotion.findOne({ 
        code: promotionData.code.toUpperCase(),
        _id: { $ne: promotionData._id }
      });
      
      if (existingPromotion) {
        const error = createHttpError(400, "Promotion code already exists");
        return next(error);
      }
    }

    // Create promotion
    const promotionPayload = {
      ...promotionData,
      createdBy: (userId && userName) ? { userId, userName } : undefined
    };

    const promotion = new Promotion(promotionPayload);
    await promotion.save();

    // Populate references for response
    await promotion.populate([
      { path: 'specificDishes', select: 'name price category' },
      { path: 'categories', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: "Promotion created successfully!",
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// Get all promotions with filtering and pagination
const getPromotions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Get promotions with pagination
    const promotions = await Promotion.find(filter)
      .populate('specificDishes', 'name price')
      .populate('categories', 'name')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Promotion.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        promotions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get promotion by ID
const getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid promotion ID");
      return next(error);
    }

    const promotion = await Promotion.findById(id)
      .populate('specificDishes', 'name price category')
      .populate('categories', 'name');

    if (!promotion) {
      const error = createHttpError(404, "Promotion not found");
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// Update promotion
const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid promotion ID");
      return next(error);
    }

    // Validate date range if dates are being updated
    if (updateData.startDate || updateData.endDate) {
      const existingPromotion = await Promotion.findById(id);
      const startDate = new Date(updateData.startDate || existingPromotion.startDate);
      const endDate = new Date(updateData.endDate || existingPromotion.endDate);
      
      if (endDate <= startDate) {
        const error = createHttpError(400, "End date must be after start date");
        return next(error);
      }
    }

    // Check for duplicate code if code is being updated
    if (updateData.code) {
      const existingPromotion = await Promotion.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (existingPromotion) {
        const error = createHttpError(400, "Promotion code already exists");
        return next(error);
      }
    }

    const promotion = await Promotion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'specificDishes', select: 'name price category' },
      { path: 'categories', select: 'name' }
    ]);

    if (!promotion) {
      const error = createHttpError(404, "Promotion not found");
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Promotion updated successfully",
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// Delete promotion
const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid promotion ID");
      return next(error);
    }

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
      const error = createHttpError(404, "Promotion not found");
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Promotion deleted successfully",
      data: { deletedId: id }
    });
  } catch (error) {
    next(error);
  }
};

// Toggle promotion status (activate/deactivate)
const togglePromotionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid promotion ID");
      return next(error);
    }

    const promotion = await Promotion.findById(id);

    if (!promotion) {
      const error = createHttpError(404, "Promotion not found");
      return next(error);
    }

    promotion.isActive = !promotion.isActive;
    await promotion.save();

    res.status(200).json({
      success: true,
      message: `Promotion ${promotion.isActive ? 'activated' : 'deactivated'} successfully`,
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// Get promotion analytics
const getPromotionAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter for promotions
    const promotionDateFilter = {};
    if (startDate) promotionDateFilter.$gte = new Date(startDate);
    if (endDate) promotionDateFilter.$lte = new Date(endDate);
    
    const promotionMatchStage = {};
    if (Object.keys(promotionDateFilter).length > 0) {
      promotionMatchStage.createdAt = promotionDateFilter;
    }

    // Build date filter for orders (to get actual discount data)
    const orderDateFilter = {};
    if (startDate) orderDateFilter.$gte = new Date(startDate);
    if (endDate) orderDateFilter.$lte = new Date(endDate);
    
    const orderMatchStage = {
      'appliedPromotions.0': { $exists: true } // Only orders with promotions
    };
    if (Object.keys(orderDateFilter).length > 0) {
      orderMatchStage.createdAt = orderDateFilter;
    }

    // Get promotion statistics
    const analytics = await Promotion.aggregate([
      { $match: promotionMatchStage },
      {
        $group: {
          _id: null,
          totalPromotions: { $sum: 1 },
          activePromotions: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          totalUsage: { $sum: "$usageCount" },
          averageUsage: { $avg: "$usageCount" }
        }
      }
    ]);

    // Get actual discount amounts from orders
    const Order = require("../models/orderModel");
    const discountAnalytics = await Order.aggregate([
      { $match: orderMatchStage },
      {
        $group: {
          _id: null,
          totalDiscountAmount: { $sum: "$bills.promotionDiscount" },
          totalOrdersWithPromotions: { $sum: 1 },
          averageDiscountPerOrder: { $avg: "$bills.promotionDiscount" }
        }
      }
    ]);

    // Get discount breakdown by promotion type
    const discountByType = await Order.aggregate([
      { $match: orderMatchStage },
      { $unwind: "$appliedPromotions" },
      {
        $group: {
          _id: "$appliedPromotions.type",
          totalDiscount: { $sum: "$appliedPromotions.discountAmount" },
          orderCount: { $sum: 1 },
          averageDiscount: { $avg: "$appliedPromotions.discountAmount" }
        }
      }
    ]);

    // Get promotion type breakdown
    const typeBreakdown = await Promotion.aggregate([
      { $match: promotionMatchStage },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalUsage: { $sum: "$usageCount" },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          }
        }
      }
    ]);

    // Get top performing promotions by actual usage in orders
    const topPromotionsByDiscount = await Order.aggregate([
      { $match: orderMatchStage },
      { $unwind: "$appliedPromotions" },
      {
        $group: {
          _id: "$appliedPromotions.promotionId",
          name: { $first: "$appliedPromotions.name" },
          type: { $first: "$appliedPromotions.type" },
          totalDiscount: { $sum: "$appliedPromotions.discountAmount" },
          usageCount: { $sum: 1 },
          averageDiscount: { $avg: "$appliedPromotions.discountAmount" }
        }
      },
      { $sort: { totalDiscount: -1 } },
      { $limit: 5 }
    ]);

    // Get top performing promotions from promotion collection
    const topPromotions = await Promotion.find(promotionMatchStage)
      .sort({ usageCount: -1 })
      .limit(5)
      .select('name type usageCount isActive');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...(analytics[0] || {
            totalPromotions: 0,
            activePromotions: 0,
            totalUsage: 0,
            averageUsage: 0
          }),
          ...(discountAnalytics[0] || {
            totalDiscountAmount: 0,
            totalOrdersWithPromotions: 0,
            averageDiscountPerOrder: 0
          })
        },
        typeBreakdown,
        discountByType,
        topPromotions,
        topPromotionsByDiscount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Validate coupon code
const validateCouponCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      const error = createHttpError(400, "Coupon code is required");
      return next(error);
    }

    const currentTime = getCurrentVietnamTime();
    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: currentTime },
      endDate: { $gte: currentTime }
    });

    let valid = false;
    let message = "Invalid or expired coupon code";

    if (promotion) {
      // Check usage limit
      if (promotion.conditions.usageLimit && 
          promotion.usageCount >= promotion.conditions.usageLimit) {
        message = "Coupon usage limit exceeded";
      } else {
        valid = true;
        message = "Coupon is valid";
      }
    }

    res.status(200).json({
      success: true,
      data: {
        valid,
        message,
        promotion: valid ? promotion : null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  getPromotionAnalytics,
  validateCouponCode
};

