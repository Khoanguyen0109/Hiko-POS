import { FaSearch } from "react-icons/fa";
import OrderList from "./OrderList";
import { useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import { fetchOrders } from "../../redux/slices/orderSlice";
import { getTodayDate } from "../../utils";
import { ROUTES } from "../../constants";

const RecentOrders = () => {
  const dispatch = useDispatch();
  const { recentOrders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    const today = getTodayDate();
    dispatch(fetchOrders({ startDate: today, endDate: today }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  return (
    <div className="px-8 mt-6">
      <div className="bg-[#1a1a1a] w-full h-[450px] rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Recent Orders
          </h1>
          <a href={ROUTES.ORDERS} className="text-[#025cca] text-sm font-semibold">
            View all
          </a>
        </div>

        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mx-6">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Search recent orders"
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5]"
          />
        </div>

        {/* Order list */}
        <div className="mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide">
          {loading ? (
            <p className="col-span-3 text-gray-500">Loading orders...</p>
          ) : recentOrders?.length > 0 ? (
            recentOrders.map((order) => {
              return <OrderList key={order._id} order={order} />;
            })
          ) : (
            <p className="col-span-3 text-gray-500">No orders available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
