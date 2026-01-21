import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import { MdRestaurantMenu, MdAccountBalance, MdMoney, MdStore, MdStorefront, MdAccessTime } from "react-icons/md";
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
        inProgressOrders: 0,
        totalInProgressValue: 0,
        totalDishesOrdered: 0,
        totalCash: 0,
        totalBanking: 0,
        vendorBreakdown: {
          None: { earnings: 0, orders: 0 },
          Shopee: { earnings: 0, orders: 0 },
          Grab: { earnings: 0, orders: 0 },
          BeFood: { earnings: 0, orders: 0 },
          XanhSM: { earnings: 0, orders: 0 },
        },
      };
    }

    // Filter orders for today and completed status for earnings
    const completedOrders = orders.filter(
      (order) => order.orderStatus === "completed"
    );

    // Filter in-progress orders
    const inProgressOrders = orders.filter(
      (order) => order.orderStatus === "progress"
    );

    // Calculate total value of in-progress orders
    const totalInProgressValue = inProgressOrders.reduce(
      (sum, order) => sum + (order.bills?.totalWithTax || 0),
      0
    );

    const totalEarnings = completedOrders.reduce(
      (sum, order) => sum + (order.bills?.totalWithTax || 0),
      0
    );

    // Calculate payment method totals from completed orders (excluding 3rd party vendors for banking)
    const totalCash = completedOrders
      .filter(order => order.paymentMethod === 'Cash')
      .reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);

    const totalBanking = completedOrders
      .filter(order => order.paymentMethod === 'Banking' && (order.thirdPartyVendor === 'None' || !order.thirdPartyVendor))
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

    // Calculate income breakdown by third party vendor
    const vendorBreakdown = {
      None: { earnings: 0, orders: 0 },
      Shopee: { earnings: 0, orders: 0 },
      Grab: { earnings: 0, orders: 0 },
      BeFood: { earnings: 0, orders: 0 },
      XanhSM: { earnings: 0, orders: 0 },
    };

    completedOrders.forEach(order => {
      const vendor = order.thirdPartyVendor || 'None';
      const earnings = order.bills?.totalWithTax || 0;
      
      if (vendorBreakdown[vendor]) {
        vendorBreakdown[vendor].earnings += earnings;
        vendorBreakdown[vendor].orders += 1;
      }
    });

    return {
      totalEarnings,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      inProgressOrders: inProgressOrders.length,
      totalInProgressValue,
      totalDishesOrdered,
      totalCash,
      totalBanking,
      vendorBreakdown,
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
            title="In Progress"
            icon={<MdAccessTime />}
            number={loading ? "..." : formatVND(todayStats.totalInProgressValue)}
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

        {/* Third Party Vendor Income Breakdown */}
        <div className="px-4 sm:px-8 mt-6">
          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <div className="flex items-center gap-2 mb-4">
              <MdStore className="text-[#f6b100]" size={20} />
              <h2 className="text-[#f5f5f5] text-lg font-semibold">
                Income by Platform
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Direct Orders */}
              <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MdStorefront className="text-green-400" size={18} />
                    <span className="text-[#f5f5f5] font-medium text-sm">Direct</span>
                  </div>
                  <span className="text-xs text-[#ababab] bg-[#343434] px-2 py-1 rounded-full">
                    {loading ? "..." : `${todayStats.vendorBreakdown.None.orders} orders`}
                  </span>
                </div>
                <div className="text-green-400 font-bold text-lg">
                  {loading ? "..." : formatVND(todayStats.vendorBreakdown.None.earnings)}
                </div>
                <div className="text-xs text-[#ababab] mt-1">
                  Restaurant orders
                </div>
              </div>

              {/* Shopee Orders */}
              <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MdStore className="text-orange-400" size={18} />
                    <span className="text-[#f5f5f5] font-medium text-sm">Shopee</span>
                  </div>
                  <span className="text-xs text-[#ababab] bg-[#343434] px-2 py-1 rounded-full">
                    {loading ? "..." : `${todayStats.vendorBreakdown.Shopee.orders} orders`}
                  </span>
                </div>
                <div className="text-orange-400 font-bold text-lg">
                  {loading ? "..." : formatVND(todayStats.vendorBreakdown.Shopee.earnings)}
                </div>
                <div className="text-xs text-[#ababab] mt-1">
                  Shopee Food delivery
                </div>
              </div>

              {/* Grab Orders */}
              <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MdStore className="text-blue-400" size={18} />
                    <span className="text-[#f5f5f5] font-medium text-sm">Grab</span>
                  </div>
                  <span className="text-xs text-[#ababab] bg-[#343434] px-2 py-1 rounded-full">
                    {loading ? "..." : `${todayStats.vendorBreakdown.Grab.orders} orders`}
                  </span>
                </div>
                <div className="text-blue-400 font-bold text-lg">
                  {loading ? "..." : formatVND(todayStats.vendorBreakdown.Grab.earnings)}
                </div>
                <div className="text-xs text-[#ababab] mt-1">
                  Grab Food delivery
                </div>
              </div>

              {/* BeFood Orders */}
              <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MdStore className="text-purple-400" size={18} />
                    <span className="text-[#f5f5f5] font-medium text-sm">BeFood</span>
                  </div>
                  <span className="text-xs text-[#ababab] bg-[#343434] px-2 py-1 rounded-full">
                    {loading ? "..." : `${todayStats.vendorBreakdown.BeFood.orders} orders`}
                  </span>
                </div>
                <div className="text-purple-400 font-bold text-lg">
                  {loading ? "..." : formatVND(todayStats.vendorBreakdown.BeFood.earnings)}
                </div>
                <div className="text-xs text-[#ababab] mt-1">
                  BeFood delivery
                </div>
              </div>

              {/* XanhSM Orders */}
              <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MdStore className="text-teal-400" size={18} />
                    <span className="text-[#f5f5f5] font-medium text-sm">XanhSM</span>
                  </div>
                  <span className="text-xs text-[#ababab] bg-[#343434] px-2 py-1 rounded-full">
                    {loading ? "..." : `${todayStats.vendorBreakdown.XanhSM.orders} orders`}
                  </span>
                </div>
                <div className="text-teal-400 font-bold text-lg">
                  {loading ? "..." : formatVND(todayStats.vendorBreakdown.XanhSM.earnings)}
                </div>
                <div className="text-xs text-[#ababab] mt-1">
                  XanhSM delivery
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-[#343434]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                <span className="text-[#ababab]">Platform Distribution:</span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="text-green-400">
                    Direct: {loading ? "..." : `${((todayStats.vendorBreakdown.None.earnings / todayStats.totalEarnings) * 100 || 0).toFixed(1)}%`}
                  </span>
                  <span className="text-orange-400">
                    Shopee: {loading ? "..." : `${((todayStats.vendorBreakdown.Shopee.earnings / todayStats.totalEarnings) * 100 || 0).toFixed(1)}%`}
                  </span>
                  <span className="text-blue-400">
                    Grab: {loading ? "..." : `${((todayStats.vendorBreakdown.Grab.earnings / todayStats.totalEarnings) * 100 || 0).toFixed(1)}%`}
                  </span>
                  <span className="text-purple-400">
                    BeFood: {loading ? "..." : `${((todayStats.vendorBreakdown.BeFood.earnings / todayStats.totalEarnings) * 100 || 0).toFixed(1)}%`}
                  </span>
                  <span className="text-teal-400">
                    XanhSM: {loading ? "..." : `${((todayStats.vendorBreakdown.XanhSM.earnings / todayStats.totalEarnings) * 100 || 0).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RecentOrders />
      </div>
    </section>
  );
};

export default Home;
