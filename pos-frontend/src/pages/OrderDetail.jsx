import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MdPerson,
  MdPhone,
  MdGroup,
  MdAccessTime,
  MdReceipt,
  MdPayment,
  MdLocalOffer,
  MdAccountBalance,
  MdStore,
  MdStorefront,
  MdDelete,
} from "react-icons/md";
import {
  FaCheckCircle,
  FaClock,
  FaSpinner,
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
import { formatDateAndTime, formatVND } from "../utils";
import { getStoredUser } from "../utils/auth";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";
import { FormSelect } from "../components/ui";
import PropTypes from "prop-types";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector((state) => state.orders);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

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
      setSelectedStatus(currentOrder.orderStatus);
      setSelectedPaymentMethod(currentOrder.paymentMethod || "");
    }
  }, [currentOrder]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  const handleStatusUpdate = () => {
    const hasStatusChange =
      selectedStatus && selectedStatus !== currentOrder?.orderStatus;
    const hasPaymentChange =
      selectedPaymentMethod &&
      selectedPaymentMethod !== currentOrder?.paymentMethod;

    if (!hasStatusChange && !hasPaymentChange) {
      enqueueSnackbar("No changes to update", { variant: "info" });
      return;
    }

    const updateData = { orderId };

    if (hasStatusChange) {
      updateData.orderStatus = selectedStatus;
    }

    if (hasPaymentChange) {
      updateData.paymentMethod = selectedPaymentMethod;
    }

    dispatch(updateOrder(updateData))
      .unwrap()
      .then(() => {
        let message = "Order updated successfully!";
        if (hasStatusChange && hasPaymentChange) {
          message = "Order status and payment method updated successfully!";
        } else if (hasStatusChange) {
          message = "Order status updated successfully!";
        } else if (hasPaymentChange) {
          message = "Payment method updated successfully!";
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="text-yellow-500" />;
      case "progress":
        return <FaSpinner className="text-blue-500" />;
      case "ready":
        return <FaCheckCircle className="text-green-500" />;
      case "completed":
        return <FaCheckCircle className="text-green-600" />;
      case "cancelled":
        return <FaBan className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-700";
      case "progress":
        return "bg-blue-900/20 text-blue-400 border-blue-700";
      case "ready":
        return "bg-green-900/20 text-green-400 border-green-700";
      case "completed":
        return "bg-green-900/30 text-green-300 border-green-600";
      case "cancelled":
        return "bg-red-900/20 text-red-400 border-red-700";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-700";
    }
  };

  // Helper function to get third-party vendor info
  const getVendorInfo = (vendor) => {
    switch (vendor) {
      case "Shopee":
        return {
          icon: MdStorefront,
          text: "Shopee",
          color: "text-orange-500",
          bgColor: "bg-orange-900/20",
          borderColor: "border-orange-500/30",
        };
      case "Grab":
        return {
          icon: MdStore,
          text: "Grab",
          color: "text-green-600",
          bgColor: "bg-green-900/20",
          borderColor: "border-green-500/30",
        };
      case "None":
      default:
        return {
          icon: MdStore,
          text: "Direct Order",
          color: "text-blue-500",
          bgColor: "bg-blue-900/20",
          borderColor: "border-blue-500/30",
        };
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

  const statusOptions = [
    { value: "pending", label: "Pending", icon: FaClock },
    { value: "progress", label: "In Progress", icon: FaSpinner },
    { value: "ready", label: "Ready", icon: FaCheckCircle },
    { value: "completed", label: "Completed", icon: FaCheckCircle },
    { value: "cancelled", label: "Cancelled", icon: FaBan },
  ];

  const paymentMethodOptions = [
    { value: "Cash", label: "Cash Payment", icon: FaMoneyBillWave },
    { value: "Banking", label: "Online Banking", icon: MdAccountBalance },
    { value: "Card", label: "Card Payment", icon: MdPayment },
  ];

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
          <div className="flex flex-col gap-3">
            {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Status Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[#ababab] text-xs font-medium">
                  Order Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] transition-colors"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selector - Only for orders in progress or pending */}
              {(order.orderStatus === "progress" ||
                order.orderStatus === "pending" ||
                selectedStatus === "progress" ||
                selectedStatus === "pending") && (
                <div className="flex flex-col gap-1">
                  <label className="text-[#ababab] text-xs font-medium">
                    Payment Method
                  </label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] transition-colors"
                  >
                    <option value="">Select Payment Method</option>
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons - Full width on mobile, auto width on desktop */}
            <div className="flex flex-col sm:flex-row gap-3 justify-start">
              <button
                onClick={handleStatusUpdate}
                disabled={
                  loading ||
                  (selectedStatus === order.orderStatus &&
                    selectedPaymentMethod === order.paymentMethod)
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#e09900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? "Updating..." : "Update Order"}
              </button>
              
              {/* Admin Delete Button - Only for pending or cancelled orders */}
              {isAdmin && ['pending', 'cancelled'].includes(order.orderStatus) && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                  title="Delete Order (Admin Only)"
                >
                  <MdDelete size={18} />
                  Delete Order
                </button>
              )}
            </div>
          </div>

          {/* Helper Messages */}
          <div className="flex flex-col gap-2">
            {selectedStatus === "completed" &&
              !selectedPaymentMethod &&
              !order.paymentMethod && (
                <div className="text-yellow-400 bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-500/30 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-400 flex-shrink-0 mt-0.5">
                      💡
                    </span>
                    <span>
                      Payment method is required to complete the order
                    </span>
                  </div>
                </div>
              )}
            {(order.orderStatus === "progress" ||
              order.orderStatus === "pending") && (
              <div className="text-blue-400 bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-500/30 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 flex-shrink-0 mt-0.5">ℹ️</span>
                  <span>
                    You can update both status and payment method simultaneously
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Card */}
          <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
            <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center gap-2">
              <MdReceipt size={20} />
              Order Status
            </h2>
            <div className="flex items-center gap-3">
              {getStatusIcon(order.orderStatus)}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  order.orderStatus
                )}`}
              >
                {order.orderStatus.charAt(0).toUpperCase() +
                  order.orderStatus.slice(1)}
              </span>
              <span className="text-[#ababab] text-sm">
                Created {formatDateAndTime(order.createdAt)}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
            <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center gap-2">
              <MdPerson size={20} />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.customerDetails?.name && (
                <div className="flex items-center gap-3">
                  <MdPerson className="text-[#f6b100]" size={18} />
                  <div>
                    <p className="text-[#ababab] text-xs">Name</p>
                    <p className="text-[#f5f5f5] font-medium">
                      {order.customerDetails?.name}
                    </p>
                  </div>
                </div>
              )}
              {order.customerDetails?.phone && (
                <div className="flex items-center gap-3">
                  <MdPhone className="text-[#f6b100]" size={18} />
                  <div>
                    <p className="text-[#ababab] text-xs">Phone</p>
                    <p className="text-[#f5f5f5] font-medium">
                      {order.customerDetails.phone}
                    </p>
                  </div>
                </div>
              )}
              {order.customerDetails?.guests && (
                <div className="flex items-center gap-3">
                  <MdGroup className="text-[#f6b100]" size={18} />
                  <div>
                    <p className="text-[#ababab] text-xs">Guests</p>
                    <p className="text-[#f5f5f5] font-medium">
                      {order.customerDetails.guests}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MdAccessTime className="text-[#f6b100]" size={18} />
                <div>
                  <p className="text-[#ababab] text-xs">Order Time</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {formatDateAndTime(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Third Party Vendor Information */}
          {(() => {
            const vendorInfo = getVendorInfo(order.thirdPartyVendor);
            const VendorIcon = vendorInfo.icon;

            return (
              <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
                <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center gap-2">
                  <VendorIcon size={20} className={vendorInfo.color} />
                  Order Source
                </h2>
                <div
                  className={`p-4 rounded-lg border ${vendorInfo.bgColor} ${vendorInfo.borderColor}`}
                >
                  <div className="flex items-center gap-3">
                    <VendorIcon className={vendorInfo.color} size={24} />
                    <div>
                      <p className="text-[#ababab] text-xs">Platform</p>
                      <p
                        className={`font-semibold text-lg ${vendorInfo.color}`}
                      >
                        {vendorInfo.text}
                      </p>
                    </div>
                  </div>

                  {order.thirdPartyVendor !== "None" && (
                    <div className="mt-3 pt-3 border-t border-[#343434]">
                      <p className="text-[#ababab] text-xs mb-1">Order Type</p>
                      <p className="text-[#f5f5f5] text-sm">
                        Third-Party Delivery
                      </p>
                    </div>
                  )}

                  {order.thirdPartyVendor === "None" && (
                    <div className="mt-3 pt-3 border-t border-[#343434]">
                      <p className="text-[#ababab] text-xs mb-1">Order Type</p>
                      <p className="text-[#f5f5f5] text-sm">
                        Direct Restaurant Order
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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
          {/* Payment Information */}
          <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
            <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center gap-2">
              <MdPayment size={20} />
              Payment Details
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[#ababab]">Current Payment Method</span>
                <span className="text-[#f5f5f5] font-medium">
                  {order.paymentMethod || "Not Set"}
                </span>
              </div>

              {/* Payment Method Selection - For orders in progress or pending */}
              {(order.orderStatus === "progress" ||
                order.orderStatus === "pending") && (
                <div className="pt-3 border-t border-[#343434]">
                  <FormSelect
                    label="Update Payment Method"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    options={paymentMethodOptions}
                    placeholder="Select payment method"
                    helpText="Use the 'Update Order' button above to save payment method changes"
                  />
                </div>
              )}


              {order.paymentStatus && (
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Payment Status</span>
                  <span className="text-[#f5f5f5] font-medium text-xs">
                    {order.paymentStatus}
                  </span>
                </div>
              )}
            </div>
          </div>

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
