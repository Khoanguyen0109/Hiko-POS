const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const { default: mongoose } = require("mongoose");
const { getDateRangeVietnam } = require("../utils/dateUtils");

const addOrder = async (req, res, next) => {
  try {
    const { _id: userId, name: userName } = req.user || {};
    const { customerDetails, orderStatus, bills, items, paymentMethod, thirdPartyVendor, paymentData } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = createHttpError(400, "Order must contain at least one item");
      return next(error);
    }

    if (!bills || typeof bills.total !== 'number' || bills.total < 0) {
      const error = createHttpError(400, "Valid bill total is required");
      return next(error);
    }

    if (!paymentMethod || !['Cash', 'Banking', 'Card'].includes(paymentMethod)) {
      const error = createHttpError(400, "Valid payment method is required (Cash, Banking, or Card)");
      return next(error);
    }

    // Validate thirdPartyVendor if provided
    if (thirdPartyVendor && !['None', 'Shopee', 'Grab'].includes(thirdPartyVendor)) {
      const error = createHttpError(400, "Invalid third party vendor. Must be 'None', 'Shopee', or 'Grab'");
      return next(error);
    }

    // Validate and process items
    const processedItems = items.map((item, index) => {
      // Validate required item fields
      if (!item.dishId || !mongoose.Types.ObjectId.isValid(item.dishId)) {
        throw createHttpError(400, `Invalid dishId for item at index ${index}`);
      }
      
      if (!item.name || typeof item.name !== 'string') {
        throw createHttpError(400, `Item name is required for item at index ${index}`);
      }
      
      if (typeof item.pricePerQuantity !== 'number' || item.pricePerQuantity < 0) {
        throw createHttpError(400, `Valid price per quantity is required for item at index ${index}`);
      }
      
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        throw createHttpError(400, `Valid quantity (minimum 1) is required for item at index ${index}`);
      }
      
      if (typeof item.price !== 'number' || item.price < 0) {
        throw createHttpError(400, `Valid total price is required for item at index ${index}`);
      }

      // Process the item
      const processedItem = {
        dishId: item.dishId,
        name: item.name.trim(),
        pricePerQuantity: item.pricePerQuantity,
        quantity: item.quantity,
        price: item.price,
        category: item.category ? item.category.trim() : undefined,
        image: item.image ? item.image.trim() : undefined,
        note: item.note ? item.note.trim() : undefined,
        toppings: []
      };

      // Process toppings if present
      if (item.toppings && Array.isArray(item.toppings)) {
        processedItem.toppings = item.toppings.map((topping, toppingIndex) => {
          // Validate topping fields
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

      // Add variant information if present
      if (item.variant) {
        processedItem.variant = {
          size: item.variant.size ? item.variant.size.trim() : undefined,
          price: typeof item.variant.price === 'number' ? item.variant.price : undefined,
          cost: typeof item.variant.cost === 'number' ? item.variant.cost : 0
        };
      }

      return processedItem;
    });

    // Calculate total items and verify bill total (including toppings)
    // Note: item.price already includes toppings cost, so we don't need to add toppings separately
    const calculatedTotal = processedItems.reduce((sum, item) => {
      // item.price already includes the base dish price + all toppings
      return sum + item.price;
    }, 0);
    if (Math.abs(calculatedTotal - bills.total) > 0.01) {
      const error = createHttpError(400, `Bill total (${bills.total}) does not match calculated total (${calculatedTotal})`);
      return next(error);
    }

    const orderPayload = {
      customerDetails: {
        name: customerDetails?.name ? customerDetails.name.trim() : undefined,
        phone: customerDetails?.phone ? customerDetails.phone.trim() : undefined,
        guests: customerDetails?.guests && typeof customerDetails.guests === 'number' ? customerDetails.guests : undefined
      },
      orderStatus: orderStatus || 'pending',
      bills: {
        total: bills.total,
        tax: bills.tax || 0,
        totalWithTax: bills.totalWithTax || bills.total
      },
      items: processedItems,
      paymentMethod,
      thirdPartyVendor: thirdPartyVendor || 'None',
      paymentData: paymentData || {},
      createdBy: (userId && userName) ? { userId, userName } : undefined
    };

    const order = new Order(orderPayload);
    await order.save();

    // Populate dish references for response
    await order.populate('items.dishId', 'name category price');

    res.status(201).json({ 
      success: true, 
      message: "Order created successfully!", 
      data: order 
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

    const order = await Order.findById(id)
      .populate('items.dishId', 'name category price image')
      .populate('createdBy.userId', 'name email');

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
    const { startDate, endDate, status, createdBy } = req.query;
    
    // Build query object
    let query = {};
    
    // Date filtering using Vietnam timezone
    if (startDate || endDate) {
      query.createdAt = {};
      
      const { start, end } = getDateRangeVietnam(startDate, endDate);
      
      if (start) {
        query.createdAt.$gte = start;
      }
      
      if (end) {
        query.createdAt.$lte = end;
      }
    }
    
    // Status filtering
    if (status && status !== 'all') {
      query.orderStatus = status;
    }
    
    // CreatedBy filtering
    if (createdBy && createdBy !== 'all') {
      query['createdBy.userId'] = createdBy;
    }
    
    const orders = await Order.find(query)
      .populate('items.dishId', 'name category price image')
      .populate('createdBy.userId', 'name email')
      .sort({ createdAt: -1 }); // Sort by newest first
      
    res.status(200).json({ 
      success: true,
      data: orders,
      count: orders.length,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || 'all',
        createdBy: createdBy || 'all'
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid order ID!");
      return next(error);
    }

    if (!orderStatus || !['pending', 'progress', 'ready', 'completed', 'cancelled'].includes(orderStatus)) {
      const error = createHttpError(400, "Valid order status is required (pending, progress, ready, completed, cancelled)");
      return next(error);
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    ).populate('items.dishId', 'name category price image');

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ 
      success: true, 
      message: "Order status updated successfully", 
      data: order 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrder };
