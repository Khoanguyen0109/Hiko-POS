import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MdReceipt,
  MdLocalOffer,
  MdAccountBalance,
  MdStore,
  MdStorefront,
  MdDelete,
} from "react-icons/md";
import {
  FaBan,
  FaMoneyBillWave,
} from "react-icons/fa";
import {
  fetchOrderById,
  updateOrder,
  clearCurrentOrder,
  removeOrder,
} from "../redux/slices/orderSlice";
import { enqueueSnackbar } from "notistack";
import { formatVND } from "../utils";
import { getStoredUser } from "../utils/auth";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";
import PropTypes from "prop-types";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector((state) => state.orders);
  const [selectedVendor, setSelectedVendor] = useState("");

  // Get user role for admin checking
  const user = getStoredUser();
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, orderId]);

  useEffect(() => {
    if (currentOrder) {
      setSelectedVendor(currentOrder.thirdPartyVendor || "None");
    }
  }, [currentOrder]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  const handleStatusUpdate = (status = null, paymentMethod = null) => {
    const targetStatus = status;
    const targetPayment = paymentMethod;
    const targetVendor = selectedVendor;

    const hasStatusChange =
      targetStatus && targetStatus !== currentOrder?.orderStatus;
    const hasPaymentChange =
      targetPayment &&
      targetPayment !== currentOrder?.paymentMethod;
    const hasVendorChange =
      targetVendor && targetVendor !== currentOrder?.thirdPartyVendor;

    if (!hasStatusChange && !hasPaymentChange && !hasVendorChange) {
      enqueueSnackbar("No changes to update", { variant: "info" });
      return;
    }

    const updateData = { orderId };

    if (hasStatusChange) {
      updateData.orderStatus = targetStatus;
    }

    if (hasPaymentChange) {
      updateData.paymentMethod = targetPayment;
    }

    if (hasVendorChange) {
      updateData.thirdPartyVendor = targetVendor;
    }

    dispatch(updateOrder(updateData))
      .unwrap()
      .then(() => {
        let message = "Order updated successfully!";
        const changes = [];
        if (hasStatusChange) changes.push("status");
        if (hasPaymentChange) changes.push("payment method");
        if (hasVendorChange) changes.push("vendor");
        
        if (changes.length > 0) {
          message = `Order ${changes.join(", ")} updated successfully!`;
        }

        enqueueSnackbar(message, {
          variant: "success",
        });
      })
      .catch((error) => {
        enqueueSnackbar(error, { variant: "error" });
      });
  };

  const handleDelete = async () => {
    if (!currentOrder) return;

    // Only allow deletion of pending or cancelled orders
    if (!['pending', 'cancelled'].includes(currentOrder.orderStatus)) {
      enqueueSnackbar("Only pending or cancelled orders can be deleted", { variant: "warning" });
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this order?\n\nOrder ID: ${currentOrder._id?.slice(-8)}\nCustomer: ${currentOrder.customerDetails?.name || 'Walk-in Customer'}\nTotal: ${formatVND(currentOrder.bills?.totalWithTax || 0)}\n\nThis action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        await dispatch(removeOrder(currentOrder._id)).unwrap();
        enqueueSnackbar("Order deleted successfully!", { variant: "success" });
        navigate("/orders"); // Navigate back to orders list
      } catch (error) {
        enqueueSnackbar(error || "Failed to delete order", { variant: "error" });
      }
    }
  };

  if (loading && !currentOrder) return <FullScreenLoader />;

  if (error && !currentOrder) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
            Error Loading Order
          </h2>
          <p className="text-[#ababab] mb-4">{error || "Order not found"}</p>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#e09900] transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const order = currentOrder;
  if (!order) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 sm:p-6 pb-20">
      {/* Header */}
      <div className="flex items-start flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <BackButton />
          <div className="min-w-0 flex-1">
            <h1 className="text-[#f5f5f5] text-xl sm:text-2xl font-bold truncate">
              Order Details
            </h1>
            <p className="text-[#ababab] text-xs sm:text-sm truncate">
              Order #{order._id}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {/* Third Party Vendor Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[#ababab] text-xs font-medium">
              Order Source / Vendor
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedVendor("None")}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${
                  selectedVendor === "None"
                    ? "bg-blue-600 text-white border-2 border-blue-400 shadow-lg"
                    : "bg-[#262626] text-[#f5f5f5] border border-[#343434] hover:border-blue-500"
                }`}
              >
                <MdStore size={16} />
                Direct
              </button>
              <button
                onClick={() => setSelectedVendor("Shopee")}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${
                  selectedVendor === "Shopee"
                    ? "bg-orange-600 text-white border-2 border-orange-400 shadow-lg"
                    : "bg-[#262626] text-[#f5f5f5] border border-[#343434] hover:border-orange-500"
                }`}
              >
                <MdStorefront size={16} />
                Shopee
              </button>
              <button
                onClick={() => setSelectedVendor("Grab")}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${
                  selectedVendor === "Grab"
                    ? "bg-green-600 text-white border-2 border-green-400 shadow-lg"
                    : "bg-[#262626] text-[#f5f5f5] border border-[#343434] hover:border-green-500"
                }`}
              >
                <MdStore size={16} />
                Grab
              </button>
            </div>
          </div>

          {/* Quick Payment Action Buttons */}
          <div className="flex flex-col gap-2">
            <label className="text-[#ababab] text-xs font-medium">
              Quick Actions (Payment & Status)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusUpdate("completed", "Cash")}
                disabled={loading}
                className={`px-5 py-3 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${
                  order.paymentMethod === "Cash" && order.orderStatus === "completed"
                    ? "bg-green-600 text-white border-2 border-green-400 shadow-lg"
                    : "bg-[#262626] text-[#f5f5f5] border border-[#343434] hover:border-green-500"
                }`}
              >
                <FaMoneyBillWave size={16} />
                Cash Payment
              </button>
              <button
                onClick={() => handleStatusUpdate("completed", "Banking")}
                disabled={loading}
                className={`px-5 py-3 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${
                  order.paymentMethod === "Banking" && order.orderStatus === "completed"
                    ? "bg-blue-600 text-white border-2 border-blue-400 shadow-lg"
                    : "bg-[#262626] text-[#f5f5f5] border border-[#343434] hover:border-blue-500"
                }`}
              >
                <MdAccountBalance size={16} />
                Banking
              </button>
              <button
                onClick={() => handleStatusUpdate("cancelled", null)}
                disabled={loading}
                className={`px-5 py-3 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${
                  order.orderStatus === "cancelled"
                    ? "bg-red-600 text-white border-2 border-red-400 shadow-lg"
                    : "bg-[#262626] text-[#f5f5f5] border border-[#343434] hover:border-red-500"
                }`}
              >
                <FaBan size={16} />
                Cancel Order
              </button>
            </div>
          </div>

          {/* Admin Delete Button - Only for pending or cancelled orders */}
          {isAdmin && ['pending', 'cancelled'].includes(order.orderStatus) && (
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-2.5 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2 border border-red-600"
                title="Delete Order (Admin Only)"
              >
                <MdDelete size={18} />
                Delete Order (Admin)
              </button>
            </div>
          )}

          {/* Helper Messages */}
          <div className="flex flex-col gap-2">
            <div className="text-blue-400 bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-500/30 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 flex-shrink-0 mt-0.5">💡</span>
                <span>
                  Use quick action buttons to complete payment or cancel the order. Update vendor if needed.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
            <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4">
              Order Items ({order.items?.length || 0})
            </h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <OrderItem key={index} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Applied Promotions */}
          {order.appliedPromotions && order.appliedPromotions.length > 0 && (
            <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
              <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center gap-2">
                <MdLocalOffer size={20} className="text-green-400" />
                Applied Promotions
              </h2>
              <div className="space-y-3">
                {order.appliedPromotions.map((promotion, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-900/10 border border-green-500/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-[#f5f5f5] font-medium">
                          {promotion.name}
                        </span>
                      </div>
                      <span className="text-green-400 font-semibold">
                        -{formatVND(promotion.discountAmount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#ababab]">
                      {promotion.code && (
                        <span>
                          Code:{" "}
                          <span className="text-[#f5f5f5]">
                            {promotion.code}
                          </span>
                        </span>
                      )}
                      <span>
                        Type:{" "}
                        <span className="text-[#f5f5f5] capitalize">
                          {promotion.type?.replace("_", " ")}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bill Summary */}
          <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
            <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4">
              Bill Summary
            </h2>
            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between">
                <span className="text-[#ababab]">
                  Subtotal ({order.items?.length || 0} items)
                </span>
                <span className="text-[#f5f5f5]">
                  {formatVND(order.bills?.subtotal || order.bills?.total || 0)}
                </span>
              </div>

              {/* Promotion Discount */}
              {order.bills?.promotionDiscount > 0 && (
                <div className="bg-green-900/10 rounded-md p-3 border border-green-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-medium">
                      Promotion Discount
                      {order.appliedPromotions?.[0]?.name &&
                        ` (${order.appliedPromotions[0].name})`}
                    </span>
                    <span className="text-green-400 font-semibold">
                      -{formatVND(order.bills.promotionDiscount)}
                    </span>
                  </div>
                  {order.appliedPromotions?.[0]?.code && (
                    <div className="mt-2 text-sm text-[#ababab]">
                      Code:{" "}
                      <span className="text-green-300">
                        {order.appliedPromotions[0].code}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tax */}
              {order.bills?.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Tax</span>
                  <span className="text-[#f5f5f5]">
                    {formatVND(order.bills.tax)}
                  </span>
                </div>
              )}

              <hr className="border-[#343434]" />

              {/* Final Total */}
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-[#f5f5f5]">Total</span>
                <span className="text-[#f6b100]">
                  {formatVND(
                    order.bills?.totalWithTax || order.bills?.total || 0
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Created By */}
          {order.createdBy?.userName && (
            <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
              <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4">
                Created By
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f6b100] rounded-full flex items-center justify-center">
                  <span className="text-[#1f1f1f] font-bold text-sm">
                    {order.createdBy.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[#f5f5f5] font-medium">
                    {order.createdBy.userName}
                  </p>
                  <p className="text-[#ababab] text-sm">Staff Member</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Order Item Component
const OrderItem = ({ item }) => {
  return (
    <div className="flex items-start gap-4 p-4 bg-[#262626] rounded-lg border border-[#343434]">
      {/* Item Image */}
      <div className="w-16 h-16 bg-[#343434] rounded-lg  flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MdReceipt className="text-[#ababab]" size={24} />
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-[#f5f5f5] font-medium">{item.name}</h3>
            {item.category && (
              <p className="text-[#ababab] text-xs">{item.category}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[#f6b100] font-semibold">
              {formatVND(item.price)}
            </p>
            <p className="text-[#ababab] text-xs">
              {formatVND(item.pricePerQuantity)} × {item.quantity}
            </p>
          </div>
        </div>

        {/* Variant and Toppings Information */}
        {(item.variant || item.toppings) && (
          <div className="mt-2 pt-2 border-t border-[#343434] space-y-2">
            {/* Size variant info */}
            {item.variant && (
              <div className="flex items-center gap-4">
                <span className="text-[#ababab] text-xs">
                  Size:{" "}
                  <span className="text-[#f5f5f5]">{item.variant.size}</span>
                </span>
              </div>
            )}

            {/* Toppings info */}
            {item.toppings && item.toppings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#ababab] text-xs font-medium">
                    Toppings:
                  </span>
                  <div className="flex-1 h-px bg-[#343434]"></div>
                </div>
                <div className="bg-[#1f1f1f] rounded-md p-3 space-y-2">
                  {item.toppings.map((topping, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#f6b100] rounded-full"></div>
                        <span className="text-[#f5f5f5] text-xs">
                          {topping.name}
                        </span>
                        <span className="text-[#ababab] text-xs bg-[#262626] px-2 py-0.5 rounded-full">
                          ×{topping.quantity}
                        </span>
                      </div>
                      <span className="text-[#f6b100] text-xs font-medium">
                        {formatVND(topping.totalPrice)}
                      </span>
                    </div>
                  ))}

                  {/* Total toppings price */}
                  {item.toppings.length > 1 && (
                    <div className="pt-2 mt-2 border-t border-[#343434] flex items-center justify-between">
                      <span className="text-[#ababab] text-xs font-medium">
                        Toppings Total:
                      </span>
                      <span className="text-[#f6b100] text-xs font-bold">
                        {formatVND(
                          item.toppings.reduce(
                            (sum, t) => sum + t.totalPrice,
                            0
                          )
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Special Instructions */}
        {item.note && (
          <div className="mt-2 pt-2 border-t border-[#343434]">
            <p className="text-[#ababab] text-xs">Note:</p>
            <p className="text-[#f5f5f5] text-sm">{item.note}</p>
          </div>
        )}
      </div>
    </div>
  );
};

OrderItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    pricePerQuantity: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
    category: PropTypes.string,
    image: PropTypes.string,
    variant: PropTypes.shape({
      size: PropTypes.string,
      price: PropTypes.number,
      cost: PropTypes.number,
    }),
    toppings: PropTypes.arrayOf(
      PropTypes.shape({
        toppingId: PropTypes.string,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        quantity: PropTypes.number.isRequired,
        totalPrice: PropTypes.number.isRequired,
      })
    ),
    note: PropTypes.string,
  }).isRequired,
};

export default OrderDetail;
