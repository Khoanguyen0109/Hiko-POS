import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, getSubtotal, getDiscount, getAppliedCoupon, removeAllItems, setThirdPartyVendor, calculatePricing, applyCoupon, removeCoupon } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import { createOrder } from "../../redux/slices/orderSlice";
import { fetchPromotions } from "../../redux/slices/promotionSlice";
import { enqueueSnackbar } from "notistack";
import Invoice from "../invoice/Invoice";
import CouponSelector from "./CouponInput";
import { useState, useRef, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import ThermalReceiptTemplate from "../print/ThermalReceiptTemplate";
import { formatVND } from "../../utils";
import { FaMoneyBillWave } from "react-icons/fa";
import { MdClose, MdCalculate, MdExpandMore, MdExpandLess, MdAccessTime } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";



const Bill = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const thermalReceiptRef = useRef();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const subtotal = useSelector(getSubtotal);
  const discount = useSelector(getDiscount);
  const total = useSelector(getTotalPrice);
  const appliedCoupon = useSelector(getAppliedCoupon);
  const { loading } = useSelector((state) => state.orders);
  const { items: promotions, loading: promotionsLoading } = useSelector((state) => state.promotions);
  console.log('promotions', promotions)
  
  // Debug: Log cart data to verify topping prices are included
  console.log('Bill - Cart items:', cartData.items);
  console.log('Bill - Pricing info:', { subtotal, discount, total, appliedCoupon });
  
  // Happy Hour detection helper functions (Vietnam timezone)
  const isCurrentTimeInSlot = useCallback((timeSlot) => {
    if (!timeSlot.start || !timeSlot.end) return false;
    
    // Get current time in Vietnam timezone
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    const currentTime = vietnamTime.getHours() * 60 + vietnamTime.getMinutes(); // Convert to minutes
    
    const [startHour, startMin] = timeSlot.start.split(':').map(Number);
    const [endHour, endMin] = timeSlot.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Handle time slots that cross midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }, []);

  const isCurrentDayValid = useCallback((daysOfWeek) => {
    if (!daysOfWeek || daysOfWeek.length === 0) return true; // No day restriction
    
    // Get current day in Vietnam timezone
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'Asia/Ho_Chi_Minh'
    }).toLowerCase();
    
    return daysOfWeek.includes(currentDay);
  }, []);

  const isItemEligibleForPromotion = useCallback((item, promotion) => {
    if (promotion.applicableItems === 'all_order') {
      return true;
    } else if (promotion.applicableItems === 'specific_dishes') {
      return promotion.specificDishes?.some(dish => 
        dish._id === item.dishId || dish === item.dishId
      );
    } else if (promotion.applicableItems === 'categories') {
      return promotion.categories?.some(category => {
        // Handle both ObjectId and populated category objects
        if (typeof category === 'object' && category.name) {
          // Category is populated with name
          return category.name.toLowerCase() === item.category?.toLowerCase();
        } else {
          // Category is ObjectId - check if item.category matches ID or name
          return category._id === item.category || category === item.category;
        }
      });
    }
    return false;
  }, []);

  const hasEligibleItems = useCallback((promotion) => {
    return cartData.items.some(item => isItemEligibleForPromotion(item, promotion));
  }, [cartData.items, isItemEligibleForPromotion]);

  const findActiveHappyHourPromotion = useCallback(() => {
    if (!promotions || promotions.length === 0) return null;
    console.log('promotions', promotions)
    const now = new Date();
    
    console.log('🔍 Checking Happy Hour promotions at', now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    // Filter for Happy Hour promotions
    const happyHourPromotions = promotions.filter(promotion => {
      console.log(`🎯 Checking promotion: ${promotion.name} (${promotion.type})`);
      
      // Check if it's a happy hour promotion
      if (promotion.type !== 'happy_hour') {
        console.log(`❌ Not happy hour type: ${promotion.type}`);
        return false;
      }
      
      // Check if promotion is active
      if (!promotion.isActive) {
        console.log(`❌ Promotion not active`);
        return false;
      }
      
      // Check if promotion is within valid date range
      const startDate = new Date(promotion.startDate);
      const endDate = new Date(promotion.endDate);
      if (now < startDate || now > endDate) {
        console.log(`❌ Outside date range: ${startDate} - ${endDate}`);
        return false;
      }
      
      // Check if current day is valid
      const dayValid = isCurrentDayValid(promotion.conditions?.daysOfWeek);
      if (!dayValid) {
        console.log(`❌ Invalid day. Required: ${promotion.conditions?.daysOfWeek}`);
        return false;
      }
      console.log(`✅ Day valid`);
      
      // Check if current time is within any time slot
      const timeSlots = promotion.conditions?.timeSlots || [];
      if (timeSlots.length === 0) {
        console.log(`✅ No time restrictions`);
        return true; // No time restriction
      }
      
      const isInTimeSlot = timeSlots.some(slot => {
        const inSlot = isCurrentTimeInSlot(slot);
        console.log(`🕐 Time slot ${slot.start}-${slot.end}: ${inSlot ? '✅' : '❌'}`);
        return inSlot;
      });
      if (!isInTimeSlot) {
        console.log(`❌ Not in any time slot`);
        return false;
      }
      
      // Check if cart has eligible items
      const hasEligible = hasEligibleItems(promotion);
      if (!hasEligible) {
        console.log(`❌ No eligible items in cart`);
        console.log(`Cart items:`, cartData.items.map(item => ({ name: item.name, category: item.category })));
        console.log(`Promotion categories:`, promotion.categories);
        return false;
      }
      console.log(`✅ Has eligible items`);
      
      console.log(`🎉 Promotion ${promotion.name} is VALID!`);
      return true;
    });

    // Return the highest priority promotion
    return happyHourPromotions.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] || null;
  }, [promotions, isCurrentDayValid, isCurrentTimeInSlot, hasEligibleItems]);

  // Happy Hour detection and auto-application
  useEffect(() => {
    // Fetch active promotions when component mounts
    if (promotions.length === 0 && !promotionsLoading) {
      dispatch(fetchPromotions({ isActive: true, limit: 50 }));
    }
  }, [dispatch, promotions.length, promotionsLoading]);

  // Auto-apply Happy Hour promotions
  useEffect(() => {
    if (cartData.items.length > 0 && promotions.length > 0) {
      const currentHappyHourPromotion = findActiveHappyHourPromotion();
        console.log('currentHappyHourPromotion', currentHappyHourPromotion)
      // If there's an active happy hour promotion and no coupon is applied
      if (currentHappyHourPromotion && !appliedCoupon) {
        console.log('Auto-applying Happy Hour promotion:', currentHappyHourPromotion);
        dispatch(applyCoupon(currentHappyHourPromotion));
        enqueueSnackbar(`🎉 Happy Hour promotion applied: ${currentHappyHourPromotion.name}!`, {
          variant: "success",
        });
      }
      // If happy hour has ended and we have a happy hour coupon applied
      else if (!currentHappyHourPromotion && appliedCoupon && appliedCoupon.type === 'happy_hour') {
        console.log('Happy Hour ended, removing promotion');
        dispatch(removeCoupon());
        enqueueSnackbar('Happy Hour has ended. Promotion removed.', {
          variant: "info",
        });
      }
    }
  }, [dispatch, cartData.items, promotions, appliedCoupon, findActiveHappyHourPromotion]);

  // Ensure pricing is calculated when component mounts or cart changes
  useEffect(() => {
    dispatch(calculatePricing());
  }, [dispatch, cartData.items.length, appliedCoupon]);

  // Periodic check for Happy Hour status changes (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      if (cartData.items.length > 0 && promotions.length > 0) {
        const currentHappyHourPromotion = findActiveHappyHourPromotion();
        
        // If there's an active happy hour promotion and no coupon is applied
        if (currentHappyHourPromotion && !appliedCoupon) {
          console.log('Auto-applying Happy Hour promotion (periodic check):', currentHappyHourPromotion);
          dispatch(applyCoupon(currentHappyHourPromotion));
          enqueueSnackbar(`🎉 Happy Hour promotion applied: ${currentHappyHourPromotion.name}!`, {
            variant: "success",
          });
        }
        // If happy hour has ended and we have a happy hour coupon applied
        else if (!currentHappyHourPromotion && appliedCoupon && appliedCoupon.type === 'happy_hour') {
          console.log('Happy Hour ended (periodic check), removing promotion');
          dispatch(removeCoupon());
          enqueueSnackbar('Happy Hour has ended. Promotion removed.', {
            variant: "info",
          });
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [dispatch, cartData.items.length, promotions, appliedCoupon, findActiveHappyHourPromotion]);
  const paymentMethod = useSelector((state) => state.cart.paymentMethod);
  const thirdPartyVendor = useSelector((state) => state.cart.thirdPartyVendor);

  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();
  
  // Cash payment modal states
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);
  
  // Accordion state for vendor selection
  const [isVendorAccordionOpen, setIsVendorAccordionOpen] = useState(false);

  const handleThermalPrint = useReactToPrint({
    contentRef: thermalReceiptRef,
    documentTitle: `Receipt-${customerData.orderId || Date.now()}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body { margin: 0; }
      }
    `
  });

  const handlePrintReceipt = () => {
    if (cartData.items?.length === 0) {
      enqueueSnackbar("No items in cart to print", { variant: "warning" });
      return;
    }
    handleThermalPrint();
  };

  // Cash payment functions
  const handleCashInputChange = (value) => {
    setCashReceived(value);
    const cash = parseFloat(value) || 0;
    const change = cash - total;
    setChangeAmount(change >= 0 ? change : 0);
  };

  const handleOpenCashModal = () => {
    setShowCashModal(true);
    setCashReceived("");
    setChangeAmount(0);
  };

  const handleCloseCashModal = () => {
    setShowCashModal(false);
    setCashReceived("");
    setChangeAmount(0);
  };

  const handlePlaceOrderWithCash = async () => {
    const cash = parseFloat(cashReceived) || 0;
    if (cash < total) {
      enqueueSnackbar("Insufficient cash amount!", { variant: "error" });
      return;
    }
    
    // Close the modal first
    handleCloseCashModal();
    
    // Then place the order
    await handlePlaceOrder();
    navigate(ROUTES.MENU_ORDER);
  };

  // Third party vendor options
  const vendorOptions = [
    { id: "None", label: "None", description: "Direct order" },
    { id: "Shopee", label: "Shopee", description: "Shopee Food delivery" },
    { id: "Grab", label: "Grab", description: "Grab Food delivery" }
  ];

  const handleVendorChange = (vendor) => {
    dispatch(setThirdPartyVendor(vendor));
  };

  // Quick cash amount buttons
  const quickCashAmounts = [
    total, // Exact amount
    Math.ceil(total / 50000) * 50000, // Round up to nearest 50k
    Math.ceil(total / 100000) * 100000, // Round up to nearest 100k
    Math.ceil(total / 200000) * 200000, // Round up to nearest 200k
  ].filter((amount, index, arr) => arr.indexOf(amount) === index); // Remove duplicates

  const handlePlaceOrder = async () => {
    // Enhanced order data with Happy Hour support
    const enhancedItems = cartData.items.map(item => ({
      ...item,
      // Ensure original pricing is preserved
      originalPricePerQuantity: item.originalPricePerQuantity || item.pricePerQuantity,
      originalPrice: item.originalPrice || (item.originalPricePerQuantity || item.pricePerQuantity) * item.quantity,
      // Add Happy Hour tracking if applicable
      isHappyHourItem: appliedCoupon?.type === 'happy_hour' && 
        (appliedCoupon.applicableItems === 'all_order' || 
         appliedCoupon.specificDishes?.some(dishId => dishId === item.dishId) ||
         appliedCoupon.categories?.some(categoryId => categoryId === item.category)),
      happyHourDiscount: appliedCoupon?.type === 'happy_hour' ? 
        ((item.originalPrice || item.price) - item.price) : 0,
      // Add promotion details if Happy Hour is applied
      promotionsApplied: appliedCoupon?.type === 'happy_hour' && 
        (appliedCoupon.applicableItems === 'all_order' || 
         appliedCoupon.specificDishes?.some(dishId => dishId === item.dishId) ||
         appliedCoupon.categories?.some(categoryId => categoryId === item.category)) ? [{
        promotionId: appliedCoupon._id,
        promotionName: appliedCoupon.name,
        promotionType: appliedCoupon.type,
        discountAmount: (item.originalPrice || item.price) - item.price,
        discountPercentage: appliedCoupon.discount?.percentage || null,
        appliedAt: new Date().toISOString()
      }] : []
    }));

    const orderData = {
      customerDetails: {
        name: customerData.customerName,
        phone: customerData.customerPhone,
        guests: customerData.guests,
      },
      orderStatus: "progress",
      bills: {
        subtotal: subtotal,
        promotionDiscount: discount,
        total: total,
        tax: 0,
        totalWithTax: total,
      },
      appliedPromotions: appliedCoupon ? [{
        promotionId: appliedCoupon._id,
        name: appliedCoupon.name,
        type: appliedCoupon.type,
        discountAmount: discount,
        code: appliedCoupon.code,
        appliedToItems: enhancedItems
          .filter(item => item.isHappyHourItem)
          .map(item => item.dishId)
      }] : [],
      items: enhancedItems,
      paymentMethod: cartData.paymentMethod,
      thirdPartyVendor: cartData.thirdPartyVendor,
    };
    
    dispatch(createOrder(orderData))
      .unwrap()
      .then((data) => {
        console.log(data);
        setOrderInfo(data);
        
        enqueueSnackbar("Order Placed Successfully!", {
          variant: "success",
        });
        setShowInvoice(true);
        
        // Clear cart and customer data
        setTimeout(() => {
          dispatch(removeCustomer());
          dispatch(removeAllItems());
        }, 1500);
      })
      .catch((error) => {
        console.log(error);
        const errorMessage = error || "Failed to place order";
        enqueueSnackbar(errorMessage, {
          variant: "error",
        });
      });
  };

  // Prepare thermal receipt data
  const thermalReceiptData = {
    orderId: customerData.orderId || Date.now(),
    customerName: customerData.customerName,
    customerPhone: customerData.customerPhone,
    guests: customerData.guests,
    items: cartData.items,
    subtotal: total,
    total: total,
    thirdPartyVendor: thirdPartyVendor
  };

  return (
    <>
      {/* Hidden thermal receipt template */}
      <div style={{ display: 'none' }}>
        <ThermalReceiptTemplate ref={thermalReceiptRef} orderData={thermalReceiptData} />
      </div>

      {/* Detailed Bill Breakdown */}
      <div className="px-5 mt-2">
        <div className="bg-[#262626] rounded-lg p-4 border border-[#343434]">
        
          
          
          <div className="space-y-2">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <p className="text-[#ababab] text-sm">
                Subtotal ({cartData.items?.length || 0} items)
              </p>
              <p className="text-[#f5f5f5]">
                {formatVND(subtotal)}
              </p>
            </div>
            
            {/* Discount */}
            {appliedCoupon && discount > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-green-400 text-sm">
                  Discount ({appliedCoupon.name})
                </p>
                <p className="text-green-400">
                  -{formatVND(discount)}
                </p>
              </div>
            )}
            
            {/* Divider */}
            {appliedCoupon && discount > 0 && <hr className="border-[#343434]" />}
            
            {/* Final Total */}
            <div className="flex items-center justify-between">
              <p className="text-[#f5f5f5] font-bold">
                Total
              </p>
              <h1 className="text-[#f6b100] text-xl font-bold">
                {formatVND(total)}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Selector - Hide when Happy Hour is active */}
      {!appliedCoupon || appliedCoupon.type !== 'happy_hour' ? (
        <div className="px-5 mt-4">
          <CouponSelector />
        </div>
      ) : null}

      {/* Happy Hour Status Indicator */}
      {/* {(() => {
        const currentHappyHour = findActiveHappyHourPromotion();
        if (currentHappyHour && appliedCoupon && appliedCoupon.type === 'happy_hour') {
          return (
            <div className="px-5 mt-4">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-orange-500/20 rounded-full">
                    <MdAccessTime size={20} className="text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-orange-400 font-semibold text-sm">🎉 Happy Hour Active!</h3>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full font-medium">
                        AUTO-APPLIED
                      </span>
                    </div>
                    <p className="text-[#f5f5f5] text-sm mt-1">{currentHappyHour.name}</p>
                    <p className="text-[#ababab] text-xs mt-1">
                      {currentHappyHour.discountType === 'percentage' && currentHappyHour.discount?.percentage && `${currentHappyHour.discount.percentage}% off`}
                      {currentHappyHour.discountType === 'fixed_amount' && currentHappyHour.discount?.fixedAmount && `${formatVND(currentHappyHour.discount.fixedAmount)} off`}
                      {currentHappyHour.discountType === 'uniform_price' && currentHappyHour.discount?.uniformPrice && `All variants ${formatVND(currentHappyHour.discount.uniformPrice)}`}
                      {currentHappyHour.conditions?.timeSlots?.length > 0 && (
                        ` • Valid ${currentHappyHour.conditions.timeSlots.map(slot => `${slot.start}-${slot.end}`).join(', ')}`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()} */}

      {/* Third Party Vendor Selection - Accordion */}
      <div className="px-5 mt-4">
        <div className="bg-[#262626] rounded-lg border border-[#343434]">
          {/* Accordion Header */}
          <button
            onClick={() => setIsVendorAccordionOpen(!isVendorAccordionOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#343434] transition-colors rounded-lg"
          >
            <div className="flex items-center">
              <h3 className="text-[#f5f5f5] text-sm font-medium">3rd Party Vendor</h3>
              <span className="ml-2 text-xs text-[#f6b100] bg-[#f6b100]/10 px-2 py-1 rounded-full">
                {vendorOptions.find(v => v.id === thirdPartyVendor)?.label}
              </span>
            </div>
            <div className="text-[#ababab]">
              {isVendorAccordionOpen ? (
                <MdExpandLess size={20} />
              ) : (
                <MdExpandMore size={20} />
              )}
            </div>
          </button>
          
          {/* Accordion Content */}
          {isVendorAccordionOpen && (
            <div className="px-4 pb-4 border-t border-[#343434]">
              <div className="space-y-2 mt-3">
                {vendorOptions.map((vendor) => (
                  <label
                    key={vendor.id}
                    className="flex items-center p-3 bg-[#1f1f1f] rounded-lg border border-[#343434] hover:border-[#f6b100] transition-colors cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="thirdPartyVendor"
                      value={vendor.id}
                      checked={thirdPartyVendor === vendor.id}
                      onChange={() => handleVendorChange(vendor.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                          thirdPartyVendor === vendor.id
                            ? 'border-[#f6b100] bg-[#f6b100]'
                            : 'border-[#ababab]'
                        }`}>
                          {thirdPartyVendor === vendor.id && (
                            <div className="w-2 h-2 rounded-full bg-[#1f1f1f]"></div>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            thirdPartyVendor === vendor.id ? 'text-[#f6b100]' : 'text-[#f5f5f5]'
                          }`}>
                            {vendor.label}
                          </p>
                          <p className="text-xs text-[#ababab]">{vendor.description}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#343434] text-xs text-[#ababab]">
                <span className="text-[#f5f5f5]">Selected:</span> {vendorOptions.find(v => v.id === thirdPartyVendor)?.description}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 mt-6">
        <button 
          onClick={handlePrintReceipt} 
          className="bg-[#025cca] px-4 py-3 w-full rounded-lg text-[#f5f5f5] font-semibold text-lg hover:bg-[#0248a3] transition-colors"
        >
          Print Receipt
        </button>
        <button
          onClick={paymentMethod === "Cash" ? handleOpenCashModal : handlePlaceOrder}
          disabled={cartData.items?.length === 0 || loading}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg hover:bg-[#e09900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}

      {/* Cash Payment Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md border border-[#343434]">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FaMoneyBillWave className="text-[#f6b100]" size={24} />
                <h2 className="text-[#f5f5f5] text-xl font-bold">Cash Payment</h2>
              </div>
              <button
                onClick={handleCloseCashModal}
                className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Order Total */}
            <div className="mb-6 p-4 bg-[#262626] rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <span className="text-[#ababab] text-sm">Total Amount:</span>
                <span className="text-[#f6b100] text-xl font-bold">{formatVND(total)}</span>
              </div>
            </div>

            {/* Cash Input */}
            <div className="mb-4">
              <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                Cash Received from Customer:
              </label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => handleCashInputChange(e.target.value)}
                placeholder="Enter cash amount"
                className="w-full px-4 py-3 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] text-lg"
                min="0"
                step="1000"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-4">
              <p className="text-[#ababab] text-sm mb-2">Quick amounts:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickCashAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleCashInputChange(amount.toString())}
                    className="px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm hover:bg-[#343434] hover:border-[#f6b100] transition-colors"
                  >
                    {formatVND(amount)}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Calculation */}
            {cashReceived && (
              <div className="mb-6 p-4 bg-[#262626] rounded-lg border border-[#343434]">
                <div className="flex items-center gap-2 mb-2">
                  <MdCalculate className="text-[#f6b100]" size={16} />
                  <span className="text-[#f5f5f5] text-sm font-medium">Change Calculation:</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#ababab]">Cash Received:</span>
                    <span className="text-[#f5f5f5]">{formatVND(parseFloat(cashReceived) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#ababab]">Total Amount:</span>
                    <span className="text-[#f5f5f5]">{formatVND(total)}</span>
                  </div>
                  <hr className="border-[#343434] my-2" />
                  <div className="flex justify-between font-bold">
                    <span className="text-[#f5f5f5]">Change:</span>
                    <span className={`${changeAmount <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      -{formatVND(changeAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseCashModal}
                className="flex-1 px-4 py-3 bg-[#262626] border border-[#343434] rounded-lg text-[#ababab] font-medium hover:bg-[#343434] hover:text-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceOrderWithCash}
                disabled={!cashReceived || parseFloat(cashReceived) < total}
                className="flex-1 px-4 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-bold hover:bg-[#e09900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Bill;
