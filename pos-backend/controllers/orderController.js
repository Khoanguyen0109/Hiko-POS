const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Dish = require("../models/dishModel");
const PromotionService = require("../services/promotionService");
const { default: mongoose } = require("mongoose");
const { getDateRangeVietnam } = require("../utils/dateUtils");

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
    if (thirdPartyVendor && !['None', 'Shopee', 'Grab'].includes(thirdPartyVendor)) {
      const error = createHttpError(400, "Invalid third party vendor. Must be 'None', 'Shopee', or 'Grab'");
      return next(error);
    }

    // Validate and process items
    const processedItems = await Promise.all(items.map(async (item, index) => {
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

      // Get category from dish if not provided or is 'Unknown'
      let categoryName = item.category ? item.category.trim() : undefined;
      if (!categoryName || categoryName === 'Unknown') {
        try {
          const dish = await Dish.findById(item.dishId).populate('category', 'name');
          if (dish && dish.category) {
            categoryName = dish.category.name;
          }
        } catch (error) {
          console.warn(`Failed to fetch dish category for dishId ${item.dishId}:`, error.message);
        }
      }

      // Process the item with enhanced pricing structure
      const processedItem = {
        dishId: item.dishId,
        name: item.name.trim(),
        // Enhanced pricing for promotion support
        originalPricePerQuantity: item.originalPricePerQuantity || item.pricePerQuantity,
        pricePerQuantity: item.pricePerQuantity,
        quantity: item.quantity,
        originalPrice: item.originalPrice || (item.originalPricePerQuantity || item.pricePerQuantity) * item.quantity,
        price: item.price,
        // Promotion tracking
        promotionsApplied: item.promotionsApplied || [],
        isHappyHourItem: item.isHappyHourItem || false,
        happyHourDiscount: item.happyHourDiscount || 0,
        // Standard fields
        category: categoryName,
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
    }));

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

    // Calculate totals based on promotion type
    const calculatedSubtotal = finalProcessedItems.reduce((sum, item) => {
      // Use original price for subtotal calculation
      return sum + (item.originalPrice || item.price);
    }, 0);
    
    // Calculate total based on promotion type
    let calculatedTotal;
    const hasOrderLevelPromotions = finalAppliedPromotions?.some(promo => 
      promo.type === 'order_percentage' || promo.type === 'order_fixed'
    );
    const hasItemLevelPromotions = finalAppliedPromotions?.some(promo => 
      promo.type === 'happy_hour' || promo.type === 'item_percentage' || promo.type === 'item_fixed'
    );
    
    if (hasOrderLevelPromotions && !hasItemLevelPromotions) {
      // For order-level promotions: start with subtotal, then subtract order-level discounts
      const orderLevelDiscount = finalAppliedPromotions
        .filter(promo => promo.type === 'order_percentage' || promo.type === 'order_fixed')
        .reduce((sum, promo) => sum + (promo.discountAmount || 0), 0);
      calculatedTotal = calculatedSubtotal - orderLevelDiscount;
    } else if (hasItemLevelPromotions && !hasOrderLevelPromotions) {
      // For item-level promotions: sum up final item prices (already discounted)
      calculatedTotal = finalProcessedItems.reduce((sum, item) => sum + item.price, 0);
    } else if (hasOrderLevelPromotions && hasItemLevelPromotions) {
      // Mixed promotions: start with item-level discounted prices, then apply order-level discounts
      const itemLevelTotal = finalProcessedItems.reduce((sum, item) => sum + item.price, 0);
      const orderLevelDiscount = finalAppliedPromotions
        .filter(promo => promo.type === 'order_percentage' || promo.type === 'order_fixed')
        .reduce((sum, promo) => sum + (promo.discountAmount || 0), 0);
      calculatedTotal = itemLevelTotal - orderLevelDiscount;
    } else {
      // No promotions: use original item prices
      calculatedTotal = calculatedSubtotal;
    }
    
    console.log('Backend calculation debug:', {
      hasOrderLevelPromotions,
      hasItemLevelPromotions,
      promotions: finalAppliedPromotions?.map(p => ({ name: p.name, type: p.type, discountAmount: p.discountAmount })),
      calculatedSubtotal,
      calculatedTotal,
      billsSubtotal: bills.subtotal,
      billsTotal: bills.total,
      itemPrices: finalProcessedItems.map(item => ({
        name: item.name,
        originalPrice: item.originalPrice || item.price,
        finalPrice: item.price
      }))
    });

    // Validate promotion discount if applied
    let promotionDiscount = 0;
    if (finalAppliedPromotions && Array.isArray(finalAppliedPromotions) && finalAppliedPromotions.length > 0) {
      promotionDiscount = finalAppliedPromotions.reduce((sum, promo) => sum + (promo.discountAmount || 0), 0);
    }

    // Simplified validation - frontend controls all promotion logic
    if (bills.subtotal !== undefined) {
      // Validate subtotal matches calculated subtotal
      if (Math.abs(calculatedSubtotal - bills.subtotal) > 0.01) {
        const error = createHttpError(400, `Bill subtotal (${bills.subtotal}) does not match calculated subtotal (${calculatedSubtotal})`);
        return next(error);
      }
      
      // Validate total matches calculated total (frontend already applied any promotions)
      if (Math.abs(calculatedTotal - bills.total) > 0.01) {
        const error = createHttpError(400, `Bill total (${bills.total}) does not match calculated total (${calculatedTotal})`);
        return next(error);
      }
      
      // Validate promotion discount if provided
      if (finalAppliedPromotions && finalAppliedPromotions.length > 0) {
        const expectedDiscount = calculatedSubtotal - calculatedTotal;
        if (Math.abs(expectedDiscount - (bills.promotionDiscount || 0)) > 0.01) {
          const error = createHttpError(400, `Bill promotion discount (${bills.promotionDiscount || 0}) does not match calculated discount (${expectedDiscount})`);
          return next(error);
        }
      }
    } else {
      // Legacy structure - validate total matches calculated total
      if (Math.abs(calculatedTotal - bills.total) > 0.01) {
        const error = createHttpError(400, `Bill total (${bills.total}) does not match calculated total (${calculatedTotal})`);
        return next(error);
      }
    }

    const orderPayload = {
      customerDetails: {
        name: customerDetails?.name ? customerDetails.name.trim() : undefined,
        phone: customerDetails?.phone ? customerDetails.phone.trim() : undefined,
        guests: customerDetails?.guests && typeof customerDetails.guests === 'number' ? customerDetails.guests : undefined
      },
      orderStatus: orderStatus || 'pending',
      bills: {
        subtotal: bills.subtotal || calculatedSubtotal,
        promotionDiscount: bills.promotionDiscount || promotionDiscount || (calculatedSubtotal - calculatedTotal),
        total: bills.total || calculatedTotal,
        tax: bills.tax || 0,
        totalWithTax: bills.totalWithTax || bills.total || calculatedTotal
      },
      appliedPromotions: finalAppliedPromotions,
      items: finalProcessedItems,
      paymentMethod,
      thirdPartyVendor: thirdPartyVendor || 'None',
      paymentData: paymentData || {},
      createdBy: (userId && userName) ? { userId, userName } : undefined
    };

    const order = new Order(orderPayload);
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
        totalOriginalAmount: calculatedSubtotal,
        totalDiscountAmount: calculatedSubtotal - calculatedTotal,
        totalFinalAmount: calculatedTotal,
        itemLevelDiscounts: finalProcessedItems.reduce((sum, item) => 
          sum + (item.happyHourDiscount || 0), 0),
        orderLevelDiscounts: 0 // For future order-level promotions
      }
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

    const order = await Order.findById(id)
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
    const { startDate, endDate, status, createdBy, paymentMethod, thirdPartyVendor } = req.query;
    
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
    
    // Payment method filtering
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    // Third party vendor filtering
    if (thirdPartyVendor && thirdPartyVendor !== 'all') {
      query.thirdPartyVendor = thirdPartyVendor;
    }
    
    const orders = await Order.find(query)
      .populate('items.dishId', 'name category price image')
      .populate('createdBy.userId', 'name email')
      .populate('appliedPromotions.promotionId', 'name code type discount')
      .sort({ createdAt: -1 }); // Sort by newest first
      
    res.status(200).json({ 
      success: true,
      data: orders,
      count: orders.length,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || 'all',
        createdBy: createdBy || 'all',
        paymentMethod: paymentMethod || 'all',
        thirdPartyVendor: thirdPartyVendor || 'all'
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus, paymentMethod } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid order ID!");
      return next(error);
    }

    // Build update object based on provided fields
    const updateFields = {};
    let updateMessage = "Order updated successfully";

    // Validate and add orderStatus if provided
    if (orderStatus) {
      if (!['pending', 'progress', 'ready', 'completed', 'cancelled'].includes(orderStatus)) {
        const error = createHttpError(400, "Valid order status is required (pending, progress, ready, completed, cancelled)");
        return next(error);
      }
      updateFields.orderStatus = orderStatus;
      updateMessage = "Order status updated successfully";
    }

    // Validate and add paymentMethod if provided
    if (paymentMethod) {
      if (!['Cash', 'Banking', 'Card'].includes(paymentMethod)) {
        const error = createHttpError(400, "Valid payment method is required (Cash, Banking, Card)");
        return next(error);
      }
      updateFields.paymentMethod = paymentMethod;
      updateMessage = orderStatus ? "Order status and payment method updated successfully" : "Payment method updated successfully";
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateFields).length === 0) {
      const error = createHttpError(400, "At least one field (orderStatus or paymentMethod) must be provided");
      return next(error);
    }

    // Get current order to check status restrictions for payment method updates
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    // Restrict payment method updates to orders in progress or pending
    if (paymentMethod && !orderStatus && !['pending', 'progress'].includes(currentOrder.orderStatus)) {
      const error = createHttpError(400, "Payment method can only be updated for orders that are pending or in progress");
      return next(error);
    }

    // If completing an order, ensure payment method is set
    if (orderStatus === 'completed' && !currentOrder.paymentMethod && !paymentMethod) {
      const error = createHttpError(400, "Payment method must be set before completing an order");
      return next(error);
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate('items.dishId', 'name category price image');

    // Auto-export ingredients if order is being completed
    if (orderStatus === 'completed' && currentOrder.orderStatus !== 'completed') {
      try {
        const DishRecipe = require("../models/dishRecipeModel");
        const ToppingRecipe = require("../models/toppingRecipeModel");
        const Ingredient = require("../models/ingredientModel");
        const IngredientTransaction = require("../models/ingredientTransactionModel");

        // Process each order item
        for (let item of order.items) {
          const { dishId, quantity, variant, toppings } = item;
          
          // 1. Export ingredients for the dish
          const recipe = await DishRecipe.findOne({ dishId: dishId._id, isActive: true })
            .populate('ingredients.ingredientId')
            .populate('sizeVariantRecipes.ingredients.ingredientId');

          if (!recipe) {
            console.warn(`No recipe found for dish: ${item.name || dishId._id}`);
          } else {
            // Get ingredients for this size
            const recipeData = recipe.getRecipeForSize(variant?.size);
            const ingredients = recipeData.ingredients;

            // Export each ingredient for the dish
            for (let recipeIng of ingredients) {
              const ingredient = recipeIng.ingredientId;
              if (!ingredient) continue;

              const requiredQty = recipeIng.quantity * quantity; // recipe qty × order qty

              // Check if enough stock
              if (ingredient.inventory.currentStock < requiredQty) {
                console.warn(
                  `Insufficient stock for ${ingredient.name}. ` +
                  `Required: ${requiredQty}${ingredient.unit}, ` +
                  `Available: ${ingredient.inventory.currentStock}${ingredient.unit} ` +
                  `(Order: ${order._id})`
                );
                continue;
              }

              // Create export transaction
              const transactionNumber = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
              const unitCost = ingredient.costs.averageCost || 0;
              const totalCost = requiredQty * unitCost;
              const stockBefore = ingredient.inventory.currentStock;
              const stockAfter = stockBefore - requiredQty;

              const transaction = new IngredientTransaction({
                transactionNumber,
                type: 'EXPORT',
                ingredientId: ingredient._id,
                quantity: requiredQty,
                unit: ingredient.unit,
                unitCost,
                totalCost,
                stockBefore,
                stockAfter,
                exportDetails: {
                  orderId: order._id,
                  dishId: dishId._id,
                  dishName: item.name || 'Unknown Dish',
                  reason: 'PRODUCTION'
                },
                notes: `Auto-export for order ${order._id} (dish: ${item.name || dishId._id})`
              });

              await transaction.save();

              // Update ingredient stock
              ingredient.inventory.currentStock = stockAfter;
              await ingredient.save();

              console.log(`✓ Exported ${requiredQty}${ingredient.unit} of ${ingredient.name} for dish in order ${order._id}`);
            }
          }

          // 2. Export ingredients for toppings
          if (toppings && toppings.length > 0) {
            for (let topping of toppings) {
              const toppingRecipe = await ToppingRecipe.findOne({ 
                toppingId: topping.toppingId || topping._id, 
                isActive: true 
              }).populate('ingredients.ingredientId');

              if (!toppingRecipe) {
                console.warn(`No recipe found for topping: ${topping.name || topping.toppingId}`);
                continue;
              }

              // Export each ingredient for the topping
              for (let recipeIng of toppingRecipe.ingredients) {
                const ingredient = recipeIng.ingredientId;
                if (!ingredient) continue;

                // topping quantity × order quantity
                const toppingQty = topping.quantity || 1;
                const requiredQty = recipeIng.quantity * toppingQty * quantity;

                // Check if enough stock
                if (ingredient.inventory.currentStock < requiredQty) {
                  console.warn(
                    `Insufficient stock for ${ingredient.name}. ` +
                    `Required: ${requiredQty}${ingredient.unit}, ` +
                    `Available: ${ingredient.inventory.currentStock}${ingredient.unit} ` +
                    `(Order: ${order._id}, Topping: ${topping.name})`
                  );
                  continue;
                }

                // Create export transaction
                const transactionNumber = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                const unitCost = ingredient.costs.averageCost || 0;
                const totalCost = requiredQty * unitCost;
                const stockBefore = ingredient.inventory.currentStock;
                const stockAfter = stockBefore - requiredQty;

                const transaction = new IngredientTransaction({
                  transactionNumber,
                  type: 'EXPORT',
                  ingredientId: ingredient._id,
                  quantity: requiredQty,
                  unit: ingredient.unit,
                  unitCost,
                  totalCost,
                  stockBefore,
                  stockAfter,
                  exportDetails: {
                    orderId: order._id,
                    dishId: dishId._id,
                    dishName: `${item.name || 'Unknown Dish'} + ${topping.name || 'Unknown Topping'}`,
                    reason: 'PRODUCTION'
                  },
                  notes: `Auto-export for order ${order._id} (topping: ${topping.name || topping.toppingId})`
                });

                await transaction.save();

                // Update ingredient stock
                ingredient.inventory.currentStock = stockAfter;
                await ingredient.save();

                console.log(`✓ Exported ${requiredQty}${ingredient.unit} of ${ingredient.name} for topping in order ${order._id}`);
              }
            }
          }
        }
      } catch (exportError) {
        // Log error but don't fail the order update
        console.error('Error auto-exporting ingredients:', exportError);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: updateMessage, 
      data: order 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrder };
