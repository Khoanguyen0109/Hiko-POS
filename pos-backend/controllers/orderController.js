const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Dish = require("../models/dishModel");
const PromotionService = require("../services/promotionService");
const { default: mongoose } = require("mongoose");
const { getDateRangeVietnam } = require("../utils/dateUtils");
const {
  calculateOrderBills,
  formatOrderLevelPromotions,
} = require("../utils/orderBillsUtils");

const STATUS_LABELS = {
  pending: "Pending",
  progress: "In Progress",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * Build an order history entry.
 * @param {Object} user - req.user with _id and name
 * @param {string} changeType - items_updated, status_changed, payment_updated, vendor_updated, promotions_updated
 * @param {string} description - Human-readable change summary
 * @param {Object} details - Optional { previousValue, newValue }
 */
const buildOrderHistoryEntry = (user, changeType, description, details = {}) => ({
  timestamp: new Date(),
  changedBy: user?.name ? { userId: user._id, userName: user.name } : undefined,
  changeType,
  description,
  details: Object.keys(details).length > 0 ? details : undefined,
});

/**
 * Shared helper to validate and process order items (used by addOrder and updateOrderItems).
 * Uses batched Dish lookup to avoid N+1 queries when resolving category names.
 * @param {Array} items - Raw items from request body
 * @returns {Promise<Array>} Processed items ready for order
 */
const processOrderItems = async (items) => {
  const dishIdsNeedingCategory = [
    ...new Set(
      items
        .filter((item) => {
          if (!item.dishId || !mongoose.Types.ObjectId.isValid(item.dishId)) return false;
          const cat = item.category;
          if (!cat || typeof cat !== "string") return true;
          const trimmed = cat.trim();
          return trimmed === "" || trimmed === "Unknown";
        })
        .map((item) => item.dishId.toString())
    ),
  ];

  let dishCategoryMap = new Map();
  if (dishIdsNeedingCategory.length > 0) {
    try {
      const dishes = await Dish.find({ _id: { $in: dishIdsNeedingCategory } })
        .populate("category", "name")
        .lean();
      dishCategoryMap = new Map(
        dishes
          .filter((d) => d.category && d.category.name)
          .map((d) => [d._id.toString(), d.category.name])
      );
    } catch (error) {
      console.warn("Failed to batch fetch dish categories:", error.message);
    }
  }

  return items.map((item, index) => {
    if (!item.dishId || !mongoose.Types.ObjectId.isValid(item.dishId)) {
      throw createHttpError(400, `Invalid dishId for item at index ${index}`);
    }
    if (!item.name || typeof item.name !== "string") {
      throw createHttpError(400, `Item name is required for item at index ${index}`);
    }
    if (typeof item.pricePerQuantity !== "number" || item.pricePerQuantity < 0) {
      throw createHttpError(400, `Valid price per quantity is required for item at index ${index}`);
    }
    if (typeof item.quantity !== "number" || item.quantity < 1) {
      throw createHttpError(400, `Valid quantity (minimum 1) is required for item at index ${index}`);
    }
    if (typeof item.price !== "number" || item.price < 0) {
      throw createHttpError(400, `Valid total price is required for item at index ${index}`);
    }

    let categoryName = item.category ? item.category.trim() : undefined;
    if (!categoryName || categoryName === "Unknown") {
      categoryName = dishCategoryMap.get(item.dishId.toString());
    }

    const processedItem = {
      dishId: item.dishId,
      name: item.name.trim(),
      originalPricePerQuantity: item.originalPricePerQuantity || item.pricePerQuantity,
      pricePerQuantity: item.pricePerQuantity,
      quantity: item.quantity,
      originalPrice: item.originalPrice || (item.originalPricePerQuantity || item.pricePerQuantity) * item.quantity,
      price: item.price,
      promotionsApplied: item.promotionsApplied || [],
      isHappyHourItem: item.isHappyHourItem || false,
      happyHourDiscount: item.happyHourDiscount || 0,
      category: categoryName,
      image: item.image ? item.image.trim() : undefined,
      note: item.note ? item.note.trim() : undefined,
      toppings: []
    };

    if (item.toppings && Array.isArray(item.toppings)) {
      processedItem.toppings = item.toppings.map((topping, toppingIndex) => {
        if (!topping.toppingId || !mongoose.Types.ObjectId.isValid(topping.toppingId)) {
          throw createHttpError(400, `Invalid topping ID for item ${index}, topping ${toppingIndex}`);
        }
        if (!topping.name || typeof topping.name !== 'string') {
          throw createHttpError(400, `Topping name is required for item ${index}, topping ${toppingIndex}`);
        }
        if (typeof topping.price !== 'number' || topping.price < 0) {
          throw createHttpError(400, `Valid topping price is required for item ${index}, topping ${toppingIndex}`);
        }
        if (typeof topping.quantity !== 'number' || topping.quantity < 1) {
          throw createHttpError(400, `Valid topping quantity is required for item ${index}, topping ${toppingIndex}`);
        }
        return {
          toppingId: topping.toppingId,
          name: topping.name.trim(),
          price: topping.price,
          quantity: topping.quantity
        };
      });
    }

    if (item.variant) {
      processedItem.variant = {
        size: item.variant.size ? item.variant.size.trim() : undefined,
        price: typeof item.variant.price === 'number' ? item.variant.price : undefined,
        cost: typeof item.variant.cost === 'number' ? item.variant.cost : 0
      };
    }

    return processedItem;
  });
};

const addOrder = async (req, res, next) => {
  try {
    const { _id: userId, name: userName } = req.user || {};
    const { customerDetails, orderStatus, bills, items, paymentMethod, thirdPartyVendor, paymentData, appliedPromotions } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = createHttpError(400, "Order must contain at least one item");
      return next(error);
    }

    if (!bills || typeof bills.total !== 'number' || bills.total < 0) {
      const error = createHttpError(400, "Valid bill total is required");
      return next(error);
    }

    // Payment method is optional during order creation
    if (paymentMethod && !['Cash', 'Banking', 'Card'].includes(paymentMethod)) {
      const error = createHttpError(400, "Invalid payment method. Must be 'Cash', 'Banking', or 'Card'");
      return next(error);
    }

    // Validate thirdPartyVendor if provided
    if (thirdPartyVendor && !['None', 'Shopee', 'Grab', 'BeFood', 'XanhSM'].includes(thirdPartyVendor)) {
      const error = createHttpError(400, "Invalid third party vendor. Must be 'None', 'Shopee', 'Grab', 'BeFood', or 'XanhSM'");
      return next(error);
    }

    // Validate and process items
    const processedItems = await processOrderItems(items);

    // No automatic promotion application - frontend handles all promotion logic
    let finalProcessedItems = processedItems;
    let finalAppliedPromotions = appliedPromotions || [];
    
    // Only validate promotions if they were explicitly provided by frontend
    if (appliedPromotions && appliedPromotions.length > 0) {
      try {
        console.log('🔍 Validating frontend-provided promotions:', appliedPromotions.map(p => p.name || p.promotionName));
        
        const validationResults = await PromotionService.validateHappyHourPricing(processedItems, appliedPromotions);
        const invalidItems = validationResults.filter(r => !r.valid);
        
        if (invalidItems.length > 0) {
          const errorMessages = invalidItems.map(item => item.message).join('; ');
          const error = createHttpError(400, `Promotion pricing validation failed: ${errorMessages}`);
          return next(error);
        }
        
        console.log('✅ Frontend-provided promotions validated successfully');
      } catch (error) {
        console.warn('Promotion validation failed:', error.message);
        // Continue without validation if service is unavailable
      }
    } else {
      console.log('📝 No promotions provided by frontend - using original pricing');
    }

    const calculatedBills = calculateOrderBills(
      finalProcessedItems,
      finalAppliedPromotions,
      bills.tax || 0
    );

    if (process.env.NODE_ENV === "development") {
      console.log("Backend calculation debug:", {
        promotions: finalAppliedPromotions?.map((p) => ({
          name: p.name,
          type: p.type,
          discountAmount: p.discountAmount,
        })),
        calculatedBills,
        billsFromFrontend: bills,
      });
    }

    // Simplified validation - frontend controls all promotion logic
    if (bills.subtotal !== undefined) {
      if (Math.abs(calculatedBills.subtotal - bills.subtotal) > 0.01) {
        const error = createHttpError(
          400,
          `Bill subtotal (${bills.subtotal}) does not match calculated subtotal (${calculatedBills.subtotal})`
        );
        return next(error);
      }
      if (Math.abs(calculatedBills.total - bills.total) > 0.01) {
        const error = createHttpError(
          400,
          `Bill total (${bills.total}) does not match calculated total (${calculatedBills.total})`
        );
        return next(error);
      }
      if (
        finalAppliedPromotions &&
        finalAppliedPromotions.length > 0 &&
        Math.abs(calculatedBills.promotionDiscount - (bills.promotionDiscount || 0)) > 0.01
      ) {
        const error = createHttpError(
          400,
          `Bill promotion discount (${bills.promotionDiscount || 0}) does not match calculated discount (${calculatedBills.promotionDiscount})`
        );
        return next(error);
      }
    } else {
      if (Math.abs(calculatedBills.total - bills.total) > 0.01) {
        const error = createHttpError(
          400,
          `Bill total (${bills.total}) does not match calculated total (${calculatedBills.total})`
        );
        return next(error);
      }
    }

    const orderPayload = {
      customerDetails: {
        name: customerDetails?.name ? customerDetails.name.trim() : undefined,
        phone: customerDetails?.phone ? customerDetails.phone.trim() : undefined,
        guests:
          customerDetails?.guests && typeof customerDetails.guests === "number"
            ? customerDetails.guests
            : undefined,
      },
      orderStatus: orderStatus || "pending",
      bills: {
        subtotal: bills.subtotal ?? calculatedBills.subtotal,
        promotionDiscount:
          bills.promotionDiscount ?? calculatedBills.promotionDiscount,
        total: bills.total ?? calculatedBills.total,
        tax: bills.tax ?? calculatedBills.tax,
        totalWithTax: bills.totalWithTax ?? bills.total ?? calculatedBills.totalWithTax,
      },
      appliedPromotions: finalAppliedPromotions,
      items: finalProcessedItems,
      paymentMethod,
      thirdPartyVendor: thirdPartyVendor || 'None',
      paymentData: paymentData || {},
      createdBy: (userId && userName) ? { userId, userName } : undefined,
      store: req.store._id
    };

    const order = new Order(orderPayload);

    // Record initial creation in history
    order.orderHistory = [
      buildOrderHistoryEntry(
        req.user,
        'order_created',
        `Order created with ${finalProcessedItems.length} item(s), total ${calculatedBills.total}`,
        { newValue: { itemCount: finalProcessedItems.length, total: calculatedBills.total } }
      ),
    ];

    await order.save();

    // Populate dish references and promotion details for response
    await order.populate([
      { path: 'items.dishId', select: 'name category price' },
      { path: 'appliedPromotions.promotionId', select: 'name code type discount' },
      { path: 'items.promotionsApplied.promotionId', select: 'name code type discount' }
    ]);

    // Enhanced response with promotion breakdown
    const responseData = {
      ...order.toObject(),
      promotionSummary: {
        totalOriginalAmount: calculatedBills.subtotal,
        totalDiscountAmount: calculatedBills.promotionDiscount,
        totalFinalAmount: calculatedBills.total,
        itemLevelDiscounts: finalProcessedItems.reduce(
          (sum, item) => sum + (item.happyHourDiscount || 0),
          0
        ),
        orderLevelDiscounts: 0, // For future order-level promotions
      },
    };

    res.status(201).json({ 
      success: true, 
      message: "Order created successfully!", 
      data: responseData 
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid order ID!");
      return next(error);
    }

    const order = await Order.findOne({ _id: id, store: req.store._id })
      .populate('items.dishId', 'name category price image')
      .populate('createdBy.userId', 'name email')
      .populate('appliedPromotions.promotionId', 'name code type discount');

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ 
      success: true, 
      data: order 
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const {
      startDate, endDate,
      status, createdBy, paymentMethod, thirdPartyVendor,
      page, limit,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip     = (pageNum - 1) * limitNum;

    const query = { store: req.store._id };

    if (startDate || endDate) {
      const { start, end } = getDateRangeVietnam(startDate, endDate);
      query.createdAt = {};
      if (start) query.createdAt.$gte = start;
      if (end)   query.createdAt.$lte = end;
    }

    if (status && status !== 'all')               query.orderStatus           = status;
    if (createdBy && createdBy !== 'all')          query['createdBy.userId']   = createdBy;
    if (paymentMethod && paymentMethod !== 'all')  query.paymentMethod         = paymentMethod;
    if (thirdPartyVendor && thirdPartyVendor !== 'all') query.thirdPartyVendor = thirdPartyVendor;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.dishId', 'name category price image')
        .populate('createdBy.userId', 'name email')
        .populate('appliedPromotions.promotionId', 'name code type discount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      filters: {
        startDate: startDate || null,
        endDate:   endDate   || null,
        status:    status    || 'all',
        createdBy: createdBy || 'all',
        paymentMethod:    paymentMethod    || 'all',
        thirdPartyVendor: thirdPartyVendor || 'all',
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus, paymentMethod, thirdPartyVendor, appliedPromotions } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid order ID!");
      return next(error);
    }

    // Get current order to check if order exists
    const currentOrder = await Order.findOne({ _id: id, store: req.store._id });
    if (!currentOrder) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    // Build update object based on provided fields
    const updateFields = {};
    let updateMessage = "Order updated successfully";
    const updatedFields = [];

    // Validate and add orderStatus if provided
    if (orderStatus) {
      if (!['pending', 'progress', 'ready', 'completed', 'cancelled'].includes(orderStatus)) {
        const error = createHttpError(400, "Valid order status is required (pending, progress, ready, completed, cancelled)");
        return next(error);
      }
      updateFields.orderStatus = orderStatus;
      updatedFields.push("status");
    }

    // Validate and add paymentMethod if provided
    if (paymentMethod) {
      if (!['Cash', 'Banking', 'Card'].includes(paymentMethod)) {
        const error = createHttpError(400, "Valid payment method is required (Cash, Banking, Card)");
        return next(error);
      }
      updateFields.paymentMethod = paymentMethod;
      updatedFields.push("payment method");
    }

    // Validate and add thirdPartyVendor if provided
    if (thirdPartyVendor) {
      if (!['None', 'Shopee', 'Grab', 'BeFood', 'XanhSM'].includes(thirdPartyVendor)) {
        const error = createHttpError(400, "Valid third party vendor is required (None, Shopee, Grab, BeFood, XanhSM)");
        return next(error);
      }
      updateFields.thirdPartyVendor = thirdPartyVendor;
      updatedFields.push("vendor");
    }

    // Handle promotion updates
    if (appliedPromotions !== undefined) {
      if (!appliedPromotions || appliedPromotions.length === 0) {
        updateFields.appliedPromotions = [];
        updateFields.bills = calculateOrderBills(
          currentOrder.items,
          [],
          currentOrder.bills.tax || 0
        );
        updatedFields.push("promotions removed");
      } else {
        if (!Array.isArray(appliedPromotions)) {
          const error = createHttpError(400, "appliedPromotions must be an array");
          return next(error);
        }
        const subtotal = currentOrder.items.reduce(
          (sum, item) => sum + (item.originalPrice || item.price),
          0
        );
        const formattedPromotions = formatOrderLevelPromotions(
          subtotal,
          appliedPromotions
        );
        updateFields.appliedPromotions = formattedPromotions;
        updateFields.bills = calculateOrderBills(
          currentOrder.items,
          formattedPromotions,
          currentOrder.bills.tax || 0
        );
        updatedFields.push("promotions");
      }
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateFields).length === 0) {
      const error = createHttpError(400, "At least one field (orderStatus, paymentMethod, thirdPartyVendor, or appliedPromotions) must be provided");
      return next(error);
    }

    // Update message based on what was updated
    if (updatedFields.length > 0) {
      updateMessage = `Order ${updatedFields.join(", ")} updated successfully`;
    }

    // If completing an order, ensure payment method is set
    if (orderStatus === 'completed' && !currentOrder.paymentMethod && !paymentMethod) {
      const error = createHttpError(400, "Payment method must be set before completing an order");
      return next(error);
    }

    // Determine the primary change type and details for the history entry
    let changeType, historyDetails = {};
    if (updateFields.orderStatus) {
      changeType = 'status_changed';
      historyDetails = { previousValue: currentOrder.orderStatus, newValue: orderStatus };
    } else if (updateFields.paymentMethod) {
      changeType = 'payment_updated';
      historyDetails = { previousValue: currentOrder.paymentMethod, newValue: paymentMethod };
    } else if (updateFields.thirdPartyVendor) {
      changeType = 'vendor_updated';
      historyDetails = { previousValue: currentOrder.thirdPartyVendor, newValue: thirdPartyVendor };
    } else {
      changeType = 'promotions_updated';
    }
    const historyEntry = buildOrderHistoryEntry(req.user, changeType, updateMessage, historyDetails);

    const order = await Order.findOneAndUpdate(
      { _id: id, store: req.store._id },
      { $set: updateFields, $push: { orderHistory: historyEntry } },
      { new: true }
    ).populate('items.dishId', 'name category price image');


    res.status(200).json({ 
      success: true, 
      message: updateMessage, 
      data: order 
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid order ID!");
      return next(error);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = createHttpError(400, "Order must contain at least one item");
      return next(error);
    }

    const currentOrder = await Order.findOne({ _id: id, store: req.store._id });
    if (!currentOrder) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    if (currentOrder.orderStatus !== 'progress') {
      const error = createHttpError(400, "Order can only be updated when status is 'progress' (In Progress)");
      return next(error);
    }

    const processedItems = await processOrderItems(items);

    const hasHappyHourItems = processedItems.some(
      (i) =>
        i.isHappyHourItem ||
        (i.promotionsApplied?.some((p) => p.promotionType === "happy_hour"))
    );
    if (hasHappyHourItems) {
      try {
        const validationResults = await PromotionService.validateHappyHourPricing(
          processedItems,
          currentOrder.appliedPromotions || []
        );
        const invalid = validationResults.filter((r) => !r.valid);
        if (invalid.length > 0) {
          const error = createHttpError(
            400,
            `Promotion pricing validation failed: ${invalid.map((i) => i.message).join("; ")}`
          );
          return next(error);
        }
      } catch (error) {
        console.warn("Promotion validation failed in updateOrderItems:", error.message);
        return next(
          createHttpError(
            400,
            `Happy Hour validation failed: ${error.message}`
          )
        );
      }
    }

    let appliedPromotions = currentOrder.appliedPromotions || [];
    const subtotal = processedItems.reduce(
      (sum, item) => sum + (item.originalPrice || item.price),
      0
    );
    const hasOrderLevelPromotions = appliedPromotions.some(
      (p) => p.type === "order_percentage" || p.type === "order_fixed"
    );
    const oldSubtotal = currentOrder.items.reduce(
      (sum, item) => sum + (item.originalPrice || item.price),
      0
    );
    if (hasOrderLevelPromotions && oldSubtotal > 0) {
      appliedPromotions = appliedPromotions.map((promo) => {
        const raw = promo.toObject ? promo.toObject() : { ...promo };
        if (promo.type === "order_percentage") {
          raw.discountAmount =
            (promo.discountAmount || 0) * (subtotal / oldSubtotal);
        }
        return raw;
      });
    }

    const bills = calculateOrderBills(
      processedItems,
      appliedPromotions,
      currentOrder.bills?.tax || 0
    );

    const updatePayload = {
      items: processedItems,
      bills,
    };
    if (hasOrderLevelPromotions) {
      updatePayload.appliedPromotions = appliedPromotions;
    }

    const itemsHistoryEntry = buildOrderHistoryEntry(
      req.user,
      'items_updated',
      `Order items updated: ${processedItems.length} item(s), total ${bills.total}`,
      { previousValue: currentOrder.items.length, newValue: processedItems.length }
    );

    const order = await Order.findOneAndUpdate(
      { _id: id, store: req.store._id },
      { $set: updatePayload, $push: { orderHistory: itemsHistoryEntry } },
      { new: true }
    )
      .populate('items.dishId', 'name category price image')
      .populate('appliedPromotions.promotionId', 'name code type discount');

    const responseData = {
      ...order.toObject(),
      promotionSummary: {
        totalOriginalAmount: bills.subtotal,
        totalDiscountAmount: bills.promotionDiscount,
        totalFinalAmount: bills.total,
        itemLevelDiscounts: processedItems.reduce(
          (sum, item) => sum + (item.happyHourDiscount || 0),
          0
        ),
        orderLevelDiscounts: 0,
      },
    };

    res.status(200).json({
      success: true,
      message: "Order items updated successfully",
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid order ID!");
      return next(error);
    }

    const order = await Order.findOne({ _id: id, store: req.store._id });
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    // Only allow deletion of pending or cancelled orders
    if (!['pending', 'cancelled'].includes(order.orderStatus)) {
      const error = createHttpError(400, "Only pending or cancelled orders can be deleted");
      return next(error);
    }

    await Order.findOneAndDelete({ _id: id, store: req.store._id });

    res.status(200).json({ 
      success: true, 
      message: "Order deleted successfully" 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrder, updateOrderItems, deleteOrder };
