import { FaCheckDouble, FaCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName, formatVND } from "../../utils/index";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const OrderCard = ({ order }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/orders/${order._id}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ready':
        return 'text-green-600 bg-[#2e4a40]';
      case 'completed':
        return 'text-green-600 bg-[#2e4a40]';
      case 'progress':
        return 'text-blue-600 bg-[#2e3a4a]';
      case 'pending':
        return 'text-yellow-600 bg-[#4a452e]';
      case 'cancelled':
        return 'text-red-600 bg-[#4a2e2e]';
      default:
        return 'text-yellow-600 bg-[#4a452e]';
    }
  };

  const getStatusMessage = (status) => {
    switch (status?.toLowerCase()) {
      case 'ready':
        return 'Ready to serve';
      case 'completed':
        return 'Order completed';
      case 'progress':
        return 'Preparing your order';
      case 'pending':
        return 'Order received';
      case 'cancelled':
        return 'Order cancelled';
      default:
        return 'Processing order';
    }
  };

  return (
    <div 
      className="w-full max-w-[500px] bg-[#262626] p-4 rounded-lg mb-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors duration-200 border border-transparent hover:border-[#f6b100]/30"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3 sm:gap-5">
        <button className="bg-[#f6b100] p-2 sm:p-3 text-lg sm:text-xl font-bold rounded-lg flex-shrink-0">
          {getAvatarName(order.customerDetails?.name || 'Guest')}
        </button>
        <div className="flex items-center justify-between w-full min-w-0">
          <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
            <h1 className="text-[#f5f5f5] text-base sm:text-lg font-semibold tracking-wide truncate w-full">
              {order.customerDetails?.name || 'Walk-in Customer'}
            </h1>
            <p className="text-[#ababab] text-xs sm:text-sm">#{order._id?.slice(-8)} / Dine in</p>
            {order.customerDetails?.phone && (
              <p className="text-[#ababab] text-xs sm:text-sm hidden sm:block">Phone: {order.customerDetails.phone}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <p className={`px-2 py-1 rounded-lg text-xs sm:text-sm ${getStatusColor(order.orderStatus)}`}>
              {order.orderStatus === "ready" ? (
                <FaCheckDouble className="inline mr-1 sm:mr-2" size={12} />
              ) : (
                <FaCircle className="inline mr-1 sm:mr-2" size={8} />
              )}
              <span className="hidden sm:inline">
                {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}
              </span>
              <span className="sm:hidden">
                {order.orderStatus?.charAt(0).toUpperCase()}
              </span>
            </p>
            <p className="text-[#ababab] text-xs sm:text-sm hidden sm:block">
              <FaCircle className={`inline mr-2 ${order.orderStatus === 'ready' ? 'text-green-600' : order.orderStatus === 'completed' ? 'text-green-600' : order.orderStatus === 'progress' ? 'text-blue-600' : order.orderStatus === 'cancelled' ? 'text-red-600' : 'text-yellow-600'}`} size={8} />
              {getStatusMessage(order.orderStatus)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 text-[#ababab] text-xs sm:text-sm">
        <p className="truncate flex-1 mr-2">{formatDateAndTime(order.createdAt || order.orderDate)}</p>
        <p className="flex-shrink-0">{order.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0} Items</p>
      </div>
      <hr className="w-full mt-4 border-t-1 border-gray-500" />
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-[#f5f5f5] text-base sm:text-lg font-semibold">Total</h1>
        <p className="text-[#f5f5f5] text-base sm:text-lg font-semibold">{formatVND(order.bills?.totalWithTax || 0)}</p>
      </div>
    </div>
  );
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    customerDetails: PropTypes.shape({ 
      name: PropTypes.string,
      phone: PropTypes.string 
    }),
    orderDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    orderStatus: PropTypes.string.isRequired,
    items: PropTypes.array,
    bills: PropTypes.shape({ 
      totalWithTax: PropTypes.number 
    })
  }).isRequired
}

export default OrderCard;
