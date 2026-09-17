import { useEffect, useMemo } from "react";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { useGetOrdersQuery, useUpdateOrderMutation } from "../../redux/api/endpoints";
import { unwrapList } from "../../redux/api/queryResult";
import { formatDateAndTime, getTodayDate, formatVND } from "../../utils";
import { getDateRangeByPeriodVietnam } from "../../utils/dateUtils";

const RecentOrders = ({ dateFilter = "today", customDateRange = { startDate: "", endDate: "" } }) => {
  const [updateOrder] = useUpdateOrderMutation();

  const { startDate, endDate } = useMemo(() => {
    const today = getTodayDate();
    switch (dateFilter) {
      case "week": {
        const { start } = getDateRangeByPeriodVietnam('thisWeek');
        return { startDate: start, endDate: today };
      }
      case "month": {
        const { start } = getDateRangeByPeriodVietnam('thisMonth');
        return { startDate: start, endDate: today };
      }
      case "custom": {
        if (customDateRange.startDate && customDateRange.endDate) {
          return {
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate,
          };
        }
        return { startDate: today, endDate: today };
      }
      default:
        return { startDate: today, endDate: today };
    }
  }, [dateFilter, customDateRange]);

  const { data: ordersResult, isLoading: loading, error } = useGetOrdersQuery({
    startDate,
    endDate,
  });
  const orders = unwrapList(ordersResult);
  const recentOrders = orders.slice(0, 5);

  const handleStatusChange = ({orderId, orderStatus}) => {
    updateOrder({orderId, orderStatus})
      .unwrap()
      .then(() => {
        enqueueSnackbar("Order status updated successfully!", { variant: "success" });
      })
      .catch(() => {
        enqueueSnackbar("Failed to update order status!", { variant: "error" });
      });
  };

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error?.data || error, { variant: "error" });
    }
  }, [error]);

  return (
    <div className="container mx-auto bg-[#262626] p-4 rounded-lg">
      <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
        Recent Orders
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[#f5f5f5]">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date & Time</th>
              <th className="p-3">Items</th>
              <th className="p-3">Table No</th>
              <th className="p-3">Total</th>
              <th className="p-3 text-center">Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  Loading orders...
                </td>
              </tr>
            ) : recentOrders?.length > 0 ? (
              recentOrders.map((order, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-600 hover:bg-[#333]"
                >
                  <td className="p-4">#{Math.floor(new Date(order.orderDate).getTime())}</td>
                  <td className="p-4">{order.customerDetails?.name}</td>
                  <td className="p-4">
                    <select
                      className={`bg-[#1a1a1a] text-[#f5f5f5] border border-gray-500 p-2 rounded-lg focus:outline-none ${
                        order.orderStatus === "Ready"
                          ? "text-green-500"
                          : "text-yellow-500"
                      }`}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange({orderId: order._id, orderStatus: e.target.value})}
                    >
                      <option className="text-yellow-500" value="In Progress">
                        In Progress
                      </option>
                      <option className="text-green-500" value="Ready">
                        Ready
                      </option>
                    </select>
                  </td>
                  <td className="p-4">{formatDateAndTime(order.orderDate)}</td>
                  <td className="p-4">{order.items.length} Items</td>
                  <td className="p-4">Table - {order.table?.tableNo || 'N/A'}</td>
                  <td className="p-4">{formatVND(order.bills.totalWithTax)}</td>
                  <td className="p-4">
                    {order.paymentMethod}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  No orders available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

RecentOrders.propTypes = {
  dateFilter: PropTypes.string,
  customDateRange: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
};

export default RecentOrders;
