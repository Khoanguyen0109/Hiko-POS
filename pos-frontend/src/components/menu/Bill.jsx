import { useDispatch, useSelector } from "react-redux";
import {
  getTotalPrice,
  getSubtotal,
  getDiscount,
  getAppliedCoupon,
  removeAllItems,
  calculatePricing,
} from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import { createOrder } from "../../redux/slices/orderSlice";
import { fetchPromotions } from "../../redux/slices/promotionSlice";
import { enqueueSnackbar } from "notistack";
import Invoice from "../invoice/Invoice";
import CouponSelector from "./CouponInput";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";
import ThermalReceiptTemplate from "../print/ThermalReceiptTemplate";
import { formatVND } from "../../utils";

const Bill = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const thermalReceiptRef = useRef();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const subtotal = useSelector(getSubtotal);
  const discount = useSelector(getDiscount);
  const total = useSelector(getTotalPrice);
  const appliedCoupon = useSelector(getAppliedCoupon);
  const { loading } = useSelector((state) => state.orders);
  const { items: promotions, loading: promotionsLoading } = useSelector(
    (state) => state.promotions
  );
  console.log("promotions", promotions);

  // Debug: Log cart data to verify topping prices are included
  console.log("Bill - Cart items:", cartData.items);
  console.log("Bill - Pricing info:", {
    subtotal,
    discount,
    total,
    appliedCoupon,
  });

  // Note: Happy Hour detection helper functions removed - no longer needed for manual selection

  // Note: isItemEligibleForPromotion removed - no longer needed for manual coupon selection

  // Note: findActiveHappyHourPromotion removed - happy hour is now manually selectable

  // Happy Hour detection and auto-application
  useEffect(() => {
    // Fetch active promotions when component mounts
    if (promotions.length === 0 && !promotionsLoading) {
      dispatch(fetchPromotions({ isActive: true, limit: 50 }));
    }
  }, [dispatch, promotions.length, promotionsLoading]);

  // Note: Happy Hour promotions are now manually selectable via coupon selector
  // Auto-application has been removed to give users control over promotion usage

  // Ensure pricing is calculated when component mounts or cart changes
  useEffect(() => {
    dispatch(calculatePricing());
  }, [dispatch, cartData.items.length, appliedCoupon]);

  // Note: Periodic Happy Hour checks removed - users now manually select promotions

  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();

  // Expose handlers to parent component via ref
  useImperativeHandle(ref, () => ({
    handlePlaceOrder,
    handlePrintReceipt
  }));

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
    `,
  });

  const handlePrintReceipt = () => {
    if (cartData.items?.length === 0) {
      enqueueSnackbar("No items in cart to print", { variant: "warning" });
      return;
    }
    handleThermalPrint();
  };

  const handlePlaceOrder = async () => {
    // Enhanced order data with Happy Hour support
    const enhancedItems = cartData.items.map((item) => ({
      ...item,
      // Ensure original pricing is preserved
      originalPricePerQuantity:
        item.originalPricePerQuantity || item.pricePerQuantity,
      originalPrice:
        item.originalPrice ||
        (item.originalPricePerQuantity || item.pricePerQuantity) *
          item.quantity,
      // Add Happy Hour tracking if applicable
      isHappyHourItem:
        appliedCoupon?.type === "happy_hour" &&
        (appliedCoupon.applicableItems === "all_order" ||
          appliedCoupon.specificDishes?.some(
            (dishId) => dishId === item.dishId
          ) ||
          appliedCoupon.categories?.some(
            (categoryId) => categoryId === item.category
          )),
      happyHourDiscount:
        appliedCoupon?.type === "happy_hour"
          ? (item.originalPrice || item.price) - item.price
          : 0,
      // Add promotion details if Happy Hour is applied
      promotionsApplied:
        appliedCoupon?.type === "happy_hour" &&
        (appliedCoupon.applicableItems === "all_order" ||
          appliedCoupon.specificDishes?.some(
            (dishId) => dishId === item.dishId
          ) ||
          appliedCoupon.categories?.some(
            (categoryId) => categoryId === item.category
          ))
          ? [
              {
                promotionId: appliedCoupon._id,
                promotionName: appliedCoupon.name,
                promotionType: appliedCoupon.type,
                discountAmount: (item.originalPrice || item.price) - item.price,
                discountPercentage: appliedCoupon.discount?.percentage || null,
                appliedAt: new Date().toISOString(),
              },
            ]
          : [],
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
      appliedPromotions: appliedCoupon
        ? [
            {
              promotionId: appliedCoupon._id,
              name: appliedCoupon.name,
              type: appliedCoupon.type,
              discountAmount: discount,
              code: appliedCoupon.code,
              appliedToItems: enhancedItems
                .filter((item) => item.isHappyHourItem)
                .map((item) => item.dishId),
            },
          ]
        : [],
      items: enhancedItems,
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
    thirdPartyVendor: cartData.thirdPartyVendor,
  };

  console.log("appliedCoupon", appliedCoupon);
  return (
    <>
      {/* Hidden thermal receipt template */}
      <div style={{ display: "none" }}>
        <ThermalReceiptTemplate
          ref={thermalReceiptRef}
          orderData={thermalReceiptData}
        />
      </div>

      {/* Detailed Bill Breakdown */}
      <div className="px-5 mt-2">
        <div className="bg-[#262626] rounded-lg p-3 border border-[#343434]">
          <div className="space-y-2">
            {/* Discount */}
            {appliedCoupon && discount > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-green-400 text-xs">
                    Discount ({appliedCoupon.name})
                  </p>
                  <p className="text-green-400 text-sm">-{formatVND(discount)}</p>
                </div>
                <hr className="border-[#343434]" />
              </>
            )}

            {/* Final Total */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#f5f5f5] text-sm font-bold">Total</p>
                <p className="text-[#ababab] text-xs">
                  {cartData.items?.length || 0} items
                </p>
              </div>
              <h1 className="text-[#f6b100] text-lg font-bold">
                {formatVND(total)}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        <CouponSelector />
      </div>

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

      {/* Action Buttons - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex items-center gap-3 px-5 mt-6">
        <button
          onClick={handlePrintReceipt}
          className="bg-[#025cca] px-4 py-3 w-full rounded-lg text-[#f5f5f5] font-semibold text-lg hover:bg-[#0248a3] transition-colors"
        >
          Print Receipt
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={cartData.items?.length === 0 || loading}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg hover:bg-[#e09900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
});

Bill.displayName = 'Bill';

export default Bill;
