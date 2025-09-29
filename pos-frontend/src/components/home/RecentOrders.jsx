import { FaSearch, FaClock } from "react-icons/fa";
import OrderList from "./OrderList";
import { useEffect, useMemo } from "react";
import { enqueueSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import { fetchOrders } from "../../redux/slices/orderSlice";
import { getTodayDate } from "../../utils";
import { ROUTES } from "../../constants";

const RecentOrders = () => {
  const dispatch = useDispatch();
  const { recentOrders, loading, error } = useSelector((state) => state.orders);

  // Fetch all orders for today
  useEffect(() => {
    const today = getTodayDate();
    dispatch(fetchOrders({ 
      startDate: today, 
      endDate: today
      // Remove status filter - fetch all orders
    }));
  }, [dispatch]);

  // Filter orders for "progress" status on frontend
  const ordersInProgress = useMemo(() => {
    return recentOrders?.filter(order => order.orderStatus === 'progress') || [];
  }, [recentOrders]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  return (
    <div className="px-8 mt-6">
      <div className="bg-[#1a1a1a] w-full h-[450px] rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide flex items-center gap-2">
            <FaClock className="text-orange-500" />
            Orders in Progress
          </h1>
          <a href={ROUTES.ORDERS} className="text-[#025cca] text-sm font-semibold">
            View all
          </a>
        </div>

        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mx-6">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Search orders in progress"
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5]"
          />
        </div>

        {/* Order list */}
        <div className="mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide">
          {loading ? (
            <p className="col-span-3 text-gray-500">Loading orders...</p>
          ) : ordersInProgress?.length > 0 ? (
            ordersInProgress.map((order) => {
              return <OrderList key={order._id} order={order} />;
            })
          ) : (
            <p className="col-span-3 text-gray-500">No orders in progress</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
