import { formatDateAndTime, getAvatarName, formatVND } from "../../utils/index";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Card, StatusBadge } from "../ui";
import { MdPayment, MdCreditCard, MdAccountBalance, MdMoney, MdStore, MdStorefront } from "react-icons/md";

const OrderCard = ({ order }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/orders/${order._id}`);
  };

  // Helper function to get payment method icon and display info
  const getPaymentMethodInfo = (paymentMethod) => {
    switch (paymentMethod) {
      case 'Cash':
        return { icon: MdMoney, text: 'Cash', color: 'text-green-500' };
      case 'Card':
        return { icon: MdCreditCard, text: 'Card', color: 'text-blue-500' };
      case 'Banking':
        return { icon: MdAccountBalance, text: 'Banking', color: 'text-purple-500' };
      default:
        return { icon: MdPayment, text: 'Not Set', color: 'text-gray-500' };
    }
  };

  // Helper function to get third-party vendor info
  const getVendorInfo = (vendor) => {
    switch (vendor) {
      case 'Shopee':
        return { icon: MdStorefront, text: 'Shopee', color: 'text-orange-500' };
      case 'Grab':
        return { icon: MdStore, text: 'Grab', color: 'text-green-600' };
      case 'None':
      default:
        return null; // Don't show anything for direct orders
    }
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
            {/* Payment Method Display */}
            {(() => {
              const paymentInfo = getPaymentMethodInfo(order.paymentMethod);
              const PaymentIcon = paymentInfo.icon;
              return (
                <div className="flex items-center gap-1 text-xs sm:text-sm">
                  <PaymentIcon className={`${paymentInfo.color} text-sm`} />
                  <span className={paymentInfo.color}>{paymentInfo.text}</span>
                </div>
              );
            })()}
            
            {/* Third Party Vendor Display */}
            {(() => {
              const vendorInfo = getVendorInfo(order.thirdPartyVendor);
              if (!vendorInfo) return null;
              
              const VendorIcon = vendorInfo.icon;
              return (
                <div className="flex items-center gap-1 text-xs sm:text-sm">
                  <VendorIcon className={`${vendorInfo.color} text-sm`} />
                  <span className={vendorInfo.color}>{vendorInfo.text}</span>
                </div>
              );
            })()}
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
      <div className="flex justify-between items-start mt-4 text-[#ababab] text-xs sm:text-sm">
        <p className="truncate flex-1 mr-2">{formatDateAndTime(order.createdAt || order.orderDate)}</p>
        <div className="flex-shrink-0 max-w-[60%]">
          <p className="text-right mb-1 font-medium">
            {order.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0} Items
          </p>
          <div className="text-right space-y-0.5">
            {order.items?.slice(0, 3).map((item, index) => (
              <p key={index} className="text-[#ababab] text-xs truncate">
                {item.quantity}× {item.name?.replace(/\s*\([^)]*\)/, '') || 'Unknown Item'}
              </p>
            ))}
            {order.items?.length > 3 && (
              <p className="text-[#ababab] text-xs font-medium">
                +{order.items.length - 3} more...
              </p>
            )}
          </div>
        </div>
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
    paymentMethod: PropTypes.oneOf(['Cash', 'Card', 'Banking']),
    thirdPartyVendor: PropTypes.oneOf(['None', 'Shopee', 'Grab']),
    items: PropTypes.array,
    bills: PropTypes.shape({ 
      totalWithTax: PropTypes.number 
    })
  }).isRequired
}

export default OrderCard;
