import { formatDateAndTime, formatVND } from "../../utils/index";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { removeOrder } from "../../redux/slices/orderSlice";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { Card, StatusBadge } from "../ui";
import { useV2Ui } from "../../hooks/useV2Ui";
import {
  getStatusTheme,
  getPaymentTheme,
  getVendorTheme,
  getItemCategoryTheme,
} from "../v2/orderCardTheme";
import {
  MdPayment,
  MdCreditCard,
  MdAccountBalance,
  MdMoney,
  MdStore,
  MdStorefront,
  MdDelete,
  MdPerson,
} from "react-icons/md";

const OrderCard = ({ order }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { role } = useSelector((state) => state.user);
  const { v2UiEnabled } = useV2Ui();
  const isAdmin = role === "Admin";
  const statusTheme = getStatusTheme(order.orderStatus);
  const paymentTheme = getPaymentTheme(order.paymentMethod);
  const vendorTheme = getVendorTheme(order.thirdPartyVendor);

  const handleCardClick = () => {
    navigate(`/orders/${order._id}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent card click navigation

    // Only allow deletion of pending or cancelled orders
    if (!["pending", "cancelled"].includes(order.orderStatus)) {
      enqueueSnackbar("Only pending or cancelled orders can be deleted", {
        variant: "warning",
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this order?\n\nOrder ID: ${order._id?.slice(
        -8
      )}\nCustomer: ${
        order.customerDetails?.name || "Walk-in Customer"
      }\nTotal: ${formatVND(
        order.bills?.totalWithTax || 0
      )}\n\nThis action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        await dispatch(removeOrder(order._id)).unwrap();
        enqueueSnackbar("Order deleted successfully!", { variant: "success" });
      } catch (error) {
        enqueueSnackbar(error || "Failed to delete order", {
          variant: "error",
        });
      }
    }
  };

  // Helper function to get payment method icon and display info
  const getPaymentMethodInfo = (paymentMethod) => {
    switch (paymentMethod) {
      case "Cash":
        return { icon: MdMoney, text: "Cash", color: "text-green-500" };
      case "Card":
        return { icon: MdCreditCard, text: "Card", color: "text-blue-500" };
      case "Banking":
        return {
          icon: MdAccountBalance,
          text: "Banking",
          color: "text-purple-500",
        };
      default:
        return { icon: MdPayment, text: "Not Set", color: "text-gray-500" };
    }
  };

  // Helper function to get third-party vendor info
  const getVendorInfo = (vendor) => {
    switch (vendor) {
      case "Shopee":
        return { icon: MdStorefront, text: "Shopee", color: "text-orange-500" };
      case "Grab":
        return { icon: MdStore, text: "Grab", color: "text-green-600" };
      case "BeFood":
        return { icon: MdStore, text: "BeFood", color: "text-purple-500" };
      case "XanhSM":
        return { icon: MdStore, text: "XanhSM", color: "text-teal-500" };
      case "None":
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
      className={`relative w-full max-w-[500px] mb-4 overflow-hidden ${
        v2UiEnabled ? "pl-1" : ""
      }`}
    >
      {v2UiEnabled ? (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${statusTheme.stripe}`}
          aria-hidden="true"
        />
      ) : null}
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="flex items-center justify-between w-full min-w-0">
          <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
            {v2UiEnabled ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${paymentTheme.pill}`}
                >
                  {paymentTheme.label}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${vendorTheme.pill}`}
                >
                  {vendorTheme.label}
                </span>
              </div>
            ) : (
              <>
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
              </>
            )}

            {/* Customer Display */}
            {order.customer && (
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <MdPerson className="text-brand text-sm" />
                <span className="text-brand truncate max-w-[120px]">
                  {order.customer.name || order.customer.phone}
                </span>
              </div>
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
              <StatusBadge status={order.orderStatus} type="order" size="md" />
            </div>

            {/* Admin Delete Button - Only for pending or cancelled orders */}
            {isAdmin &&
              ["pending", "cancelled"].includes(order.orderStatus) && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors duration-200"
                  title="Delete Order (Admin Only)"
                >
                  <MdDelete size={14} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-start mt-4 text-[#ababab] text-xs sm:text-sm">
        <div className="flex flex-col gap-0.5 flex-1 mr-2">
          <p className="truncate">
            {formatDateAndTime(order.createdAt || order.orderDate)}
          </p>
          {order.updatedAt && order.updatedAt !== order.createdAt && (
            <p className="truncate text-[10px] sm:text-xs text-[#888]">
              Updated: {formatDateAndTime(order.updatedAt)}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 max-w-[60%]">
          <p className="text-right mb-1 font-medium">
            {order.items?.reduce(
              (total, item) => total + (item.quantity || 0),
              0
            ) || 0}{" "}
            Items
          </p>
          <div className="text-right space-y-0.5">
            {order.items?.slice(0, 3).map((item, index) => {
              const itemName =
                item.name?.replace(/\s*\([^)]*\)/, "") || "Unknown Item";
              const categoryTheme = getItemCategoryTheme(item);

              return (
                <div
                  key={index}
                  className="flex items-center justify-end gap-1.5 text-xs"
                >
                  {v2UiEnabled ? (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${categoryTheme.chip}`}
                    >
                      {categoryTheme.label}
                    </span>
                  ) : null}
                  <p className="truncate text-[#ababab]">
                    {item.quantity}× {itemName}
                  </p>
                </div>
              );
            })}
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
        <h1 className="text-[#f5f5f5] text-base sm:text-lg font-semibold">
          Total
        </h1>
        <p className="text-[#f5f5f5] text-base sm:text-lg font-semibold">
          {formatVND(order.bills?.totalWithTax || 0)}
        </p>
      </div>
    </Card>
  );
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    customerDetails: PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string,
    }),
    customer: PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string,
    }),
    orderDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    updatedAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    orderStatus: PropTypes.string.isRequired,
    paymentMethod: PropTypes.oneOf(["Cash", "Card", "Banking"]),
    thirdPartyVendor: PropTypes.oneOf(["None", "Shopee", "Grab", "BeFood", "XanhSM"]),
    items: PropTypes.array,
    bills: PropTypes.shape({
      totalWithTax: PropTypes.number,
    }),
  }).isRequired,
};

export default OrderCard;
