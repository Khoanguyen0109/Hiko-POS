import { formatDateAndTime, getAvatarName, formatVND } from "../../utils/index";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Card, StatusBadge } from "../ui";

const OrderCard = ({ order }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/orders/${order._id}`);
  };

  // Removed getStatusColor and getStatusMessage - now using StatusBadge component

  return (
    <Card 
      variant="elevated"
      padding="md"
      hover
      clickable
      onClick={handleCardClick}
      className="w-full max-w-[500px] mb-4"
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
            {/* Mobile Status - Icon + Short Text */}
            <div className="sm:hidden">
              <StatusBadge 
                status={order.orderStatus}
                type="order"
                size="sm"
                showText={false}
              />
            </div>
            
            {/* Desktop Status - Full Badge */}
            <div className="hidden sm:block">
              <StatusBadge 
                status={order.orderStatus}
                type="order"
                size="md"
              />
            </div>
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
    </Card>
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
