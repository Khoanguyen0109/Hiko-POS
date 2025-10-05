import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import { MdRestaurantMenu, MdAccountBalance, MdMoney } from "react-icons/md";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import { fetchOrders } from "../redux/slices/orderSlice";
import { getTodayDate, formatVND } from "../utils";

const Home = () => {
  const dispatch = useDispatch();
  const { items: orders, loading } = useSelector((state) => state.orders);

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
        totalDishesOrdered: 0,
        totalCash: 0,
        totalBanking: 0,
      };
    }

    // Filter orders for today and completed status for earnings
    const completedOrders = orders.filter(
      (order) => order.orderStatus === "completed"
    );

    const totalEarnings = completedOrders.reduce(
      (sum, order) => sum + (order.bills?.totalWithTax || 0),
      0
    );

    // Calculate payment method totals from completed orders
    const totalCash = completedOrders
      .filter(order => order.paymentMethod === 'Cash')
      .reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);

    const totalBanking = completedOrders
      .filter(order => order.paymentMethod === 'Banking')
      .reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);

    // Calculate total dishes ordered across all orders (excluding cancelled orders)
    const totalDishesOrdered = orders.reduce((sum, order) => {
      // Skip cancelled orders
      if (order.orderStatus === 'cancelled') {
        return sum;
      }
      
      if (order.items && Array.isArray(order.items)) {
        return sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
      }
      return sum;
    }, 0);

    return {
      totalEarnings,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalDishesOrdered,
      totalCash,
      totalBanking,
    };
  }, [orders]);

  return (
    <section className="bg-[#1f1f1f] pb-20 flex flex-col h-auto lg:flex-row gap-3">
      {/* Left Div */}
      <div className="flex-1 lg:flex-[3]">
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
          <MiniCard
            title="Dishes Ordered"
            icon={<MdRestaurantMenu />}
            number={loading ? "..." : todayStats.totalDishesOrdered}
          />
        </div>
        
        {/* Payment Method Cards */}
        <div className="flex flex-col sm:flex-row items-center w-full gap-3 px-4 sm:px-8 mt-4">
          <MiniCard
            title="Total Cash"
            icon={<MdMoney />}
            number={loading ? "..." : formatVND(todayStats.totalCash)}
          />
          <MiniCard
            title="Total Banking"
            icon={<MdAccountBalance />}
            number={loading ? "..." : formatVND(todayStats.totalBanking)}
          />
        </div>
        <RecentOrders />
      </div>
    </section>
  );
};

export default Home;
