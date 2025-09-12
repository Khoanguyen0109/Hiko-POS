import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdPerson, MdPhone, MdGroup, MdAccessTime, MdReceipt, MdPayment } from "react-icons/md";
import { FaCheckCircle, FaClock, FaSpinner, FaBan } from "react-icons/fa";
import { fetchOrderById, updateOrder, clearCurrentOrder } from "../redux/slices/orderSlice";
import { enqueueSnackbar } from "notistack";
import { formatDateAndTime, formatVND } from "../utils";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";
import PropTypes from "prop-types";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector((state) => state.orders);
  const [selectedStatus, setSelectedStatus] = useState("");

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
    }
  }, [currentOrder]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  const handleStatusUpdate = () => {
    if (selectedStatus && selectedStatus !== currentOrder?.orderStatus) {
      dispatch(updateOrder({ orderId, orderStatus: selectedStatus }))
        .unwrap()
        .then(() => {
          enqueueSnackbar("Order status updated successfully!", { variant: "success" });
        })
        .catch((error) => {
          enqueueSnackbar(error, { variant: "error" });
        });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'progress':
        return <FaSpinner className="text-blue-500" />;
      case 'ready':
        return <FaCheckCircle className="text-green-500" />;
      case 'completed':
        return <FaCheckCircle className="text-green-600" />;
      case 'cancelled':
        return <FaBan className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-700';
      case 'progress':
        return 'bg-blue-900/20 text-blue-400 border-blue-700';
      case 'ready':
        return 'bg-green-900/20 text-green-400 border-green-700';
      case 'completed':
        return 'bg-green-900/30 text-green-300 border-green-600';
      case 'cancelled':
        return 'bg-red-900/20 text-red-400 border-red-700';
      default:
        return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  if (loading && !currentOrder) return <FullScreenLoader />;

  if (error && !currentOrder) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">Error Loading Order</h2>
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
    { value: 'pending', label: 'Pending', icon: FaClock },
    { value: 'progress', label: 'In Progress', icon: FaSpinner },
    { value: 'ready', label: 'Ready', icon: FaCheckCircle },
    { value: 'completed', label: 'Completed', icon: FaCheckCircle },
    { value: 'cancelled', label: 'Cancelled', icon: FaBan },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-[#f5f5f5] text-2xl font-bold">Order Details</h1>
            <p className="text-[#ababab] text-sm">Order #{order._id}</p>
          </div>
        </div>
        
        {/* Status Update Section */}
        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] transition-colors"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={loading || selectedStatus === order.orderStatus}
            className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#e09900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Updating..." : "Update Status"}
          </button>
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
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
                    <p className="text-[#f5f5f5] font-medium">{order.customerDetails.name}</p>
                  </div>
                </div>
              )}
              {order.customerDetails?.phone && (
                <div className="flex items-center gap-3">
                  <MdPhone className="text-[#f6b100]" size={18} />
                  <div>
                    <p className="text-[#ababab] text-xs">Phone</p>
                    <p className="text-[#f5f5f5] font-medium">{order.customerDetails.phone}</p>
                  </div>
                </div>
              )}
              {order.customerDetails?.guests && (
                <div className="flex items-center gap-3">
                  <MdGroup className="text-[#f6b100]" size={18} />
                  <div>
                    <p className="text-[#ababab] text-xs">Guests</p>
                    <p className="text-[#f5f5f5] font-medium">{order.customerDetails.guests}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MdAccessTime className="text-[#f6b100]" size={18} />
                <div>
                  <p className="text-[#ababab] text-xs">Order Time</p>
                  <p className="text-[#f5f5f5] font-medium">{formatDateAndTime(order.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#ababab]">Payment Method</span>
                <span className="text-[#f5f5f5] font-medium">{order.paymentMethod}</span>
              </div>
              {order.paymentData?.razorpay_payment_id && (
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Payment ID</span>
                  <span className="text-[#f5f5f5] font-medium text-xs">
                    {order.paymentData.razorpay_payment_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
            <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4">Bill Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#ababab]">Subtotal</span>
                <span className="text-[#f5f5f5]">{formatVND(order.bills?.total || 0)}</span>
              </div>
              {order.bills?.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Tax</span>
                  <span className="text-[#f5f5f5]">{formatVND(order.bills.tax)}</span>
                </div>
              )}
              <hr className="border-[#343434]" />
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-[#f5f5f5]">Total</span>
                <span className="text-[#f6b100]">{formatVND(order.bills?.totalWithTax || 0)}</span>
              </div>
            </div>
          </div>

          {/* Created By */}
          {order.createdBy?.userName && (
            <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
              <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4">Created By</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f6b100] rounded-full flex items-center justify-center">
                  <span className="text-[#1f1f1f] font-bold text-sm">
                    {order.createdBy.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[#f5f5f5] font-medium">{order.createdBy.userName}</p>
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
      <div className="w-16 h-16 bg-[#343434] rounded-lg overflow-hidden flex-shrink-0">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
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
            <p className="text-[#f6b100] font-semibold">{formatVND(item.price)}</p>
            <p className="text-[#ababab] text-xs">
              {formatVND(item.pricePerQuantity)} × {item.quantity}
            </p>
          </div>
        </div>

        {/* Variant Information */}
        {item.variant && (
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#343434]">
            <span className="text-[#ababab] text-xs">
              Size: <span className="text-[#f5f5f5]">{item.variant.size}</span>
            </span>
            {item.variant.cost > 0 && (
              <span className="text-[#ababab] text-xs">
                Cost: <span className="text-[#f5f5f5]">{formatVND(item.variant.cost)}</span>
              </span>
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
    note: PropTypes.string,
  }).isRequired,
};

export default OrderDetail; 