import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import { fetchOrders } from "../redux/slices/orderSlice";
import { getTodayDate } from "../utils";

const Home = () => {
  const dispatch = useDispatch();
  const { items: orders, loading } = useSelector((state) => state.orders);
  console.log('orders', orders)

  useEffect(() => {
    document.title = "POS | Home";

    // Fetch today's orders for the dashboard stats
    const today = getTodayDate();
    dispatch(fetchOrders({ startDate: today, endDate: today }));
  }, [dispatch]);

  // Calculate today's statistics
  const todayStats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalEarnings: 0,
        totalOrders: 0,
        completedOrders: 0,
      };
    }

    // Filter orders for today and completed status for earnings
    const completedOrders = orders.filter(
      (order) => order.orderStatus === "completed"
    );
    console.log('completedOrders', completedOrders)

    const totalEarnings = completedOrders.reduce(
      (sum, order) => sum + (order.bills?.totalWithTax || 0),
      0
    );
    console.log('totalEarnings', totalEarnings)

    return {
      totalEarnings,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
    };
  }, [orders]);

  return (
    <section className="bg-[#1f1f1f] pb-20 flex flex-col h-auto lg:flex-row gap-3">
      {/* Left Div */}
      <div className="flex-1 lg:flex-[3]">
        <Greetings />
        <div className="flex flex-col sm:flex-row items-center w-full gap-3 px-4 sm:px-8 mt-8">
          <MiniCard
            title="Total Earnings"
            icon={<BsCashCoin />}
            number={loading ? "..." : todayStats.totalEarnings}
          />
          <MiniCard
            title="Total Orders"
            icon={<GrInProgress />}
            number={loading ? "..." : todayStats.totalOrders}
          />
        </div>
        <RecentOrders />
      </div>
      {/* Right Div */}
      <div className="flex-1 lg:flex-[2]">
        <PopularDishes />
      </div>
    </section>
  );
};

export default Home;
