import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../redux/slices/orderSlice";
import { fetchDishes } from "../../redux/slices/dishSlice";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchSpendingAnalytics } from "../../redux/slices/spendingSlice";
import { getTodayDate, formatVND } from "../../utils";
import { getDateRangeByPeriodVietnam } from "../../utils/dateUtils";
import PropTypes from "prop-types";
import {
  RevenueTrendChart,
  RevenueByCategoryChart,
  PaymentMethodChart,
  TopDishesChart,
  SalesHeatmapChart,
  CustomerTrafficChart,
  VendorRevenueChart,
  VendorOrdersChart,
  VendorTrendChart,
  VendorPerformanceChart
} from "../charts";

const Metrics = ({ dateFilter = "today", customDateRange = { startDate: "", endDate: "" } }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const { items: orders, loading: ordersLoading } = useSelector((state) => state.orders);
  const { items: dishes, loading: dishesLoading } = useSelector((state) => state.dishes);
  const { items: categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { analyticsData: spendingData, analyticsLoading: spendingLoading } = useSelector((state) => state.spending);

  useEffect(() => {
    // Fetch data based on selected date range
    const today = getTodayDate();
    let startDate, endDate;
    
    switch (dateFilter) {
      case "today": {
        startDate = endDate = today;
        break;
      }
      case "week": {
        const { start } = getDateRangeByPeriodVietnam('last7days');
        startDate = start;
        endDate = today;
        break;
      }
      case "month": {
        const { start } = getDateRangeByPeriodVietnam('last30days');
        startDate = start;
        endDate = today;
        break;
      }
      case "custom": {
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = customDateRange.startDate;
          endDate = customDateRange.endDate;
        } else {
          // Fallback to today if custom range is incomplete
          startDate = endDate = today;
        }
        break;
      }
      default: {
        startDate = endDate = today;
      }
    }

    dispatch(fetchOrders({ startDate, endDate }));
    dispatch(fetchDishes());
    dispatch(fetchCategories());
    
    // Fetch spending analytics with the same date range
    const spendingParams = {};
    if (dateFilter === "custom" && customDateRange.startDate && customDateRange.endDate) {
      spendingParams.startDate = customDateRange.startDate;
      spendingParams.endDate = customDateRange.endDate;
    } else if (dateFilter !== "custom") {
      spendingParams.period = dateFilter;
    }
    dispatch(fetchSpendingAnalytics(spendingParams));
  }, [dispatch, dateFilter, customDateRange]);

  // Calculate metrics data
  const metricsData = useMemo(() => {
    const completedOrders = orders?.filter(order => order.orderStatus === "completed") || [];
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);
    
    // Get spending data
    const totalSpending = spendingData?.summary?.totalAmount || 0;
    const spendingCount = spendingData?.summary?.count || 0;
    
    // Calculate profit (revenue - spending)
    const profit = totalRevenue - totalSpending;
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

    return [
      { 
        title: "Revenue", 
        value: formatVND(totalRevenue), 
        percentage: "12%", 
        color: "#025cca", 
        isIncrease: true 
      },
      { 
        title: "Total Spending", 
        value: formatVND(totalSpending), 
        percentage: spendingCount > 0 ? "8%" : "0%", 
        color: "#EF4444", 
        isIncrease: false 
      },
      { 
        title: "Net Profit", 
        value: formatVND(profit), 
        percentage: `${profitMargin}%`, 
        color: profit >= 0 ? "#02ca3a" : "#be3e3f", 
        isIncrease: profit >= 0 
      },
      { 
        title: "Total Orders", 
        value: (orders?.length || 0).toString(), 
        percentage: "16%", 
        color: "#f6b100", 
        isIncrease: true 
      },
    ];
  }, [orders, spendingData]);

  // Calculate items data
  const itemsData = useMemo(() => {
    const activeCategories = categories?.filter(cat => cat.isActive) || [];
    const availableDishes = dishes?.filter(dish => dish.isAvailable) || [];
    
    // Get spending metrics
    const totalSpendingRecords = spendingData?.summary?.count || 0;
    const avgSpendingAmount = spendingData?.summary?.avgAmount || 0;

    return [
      { 
        title: "Active Categories", 
        value: activeCategories.length.toString(), 
        percentage: "12%", 
        color: "#5b45b0", 
        isIncrease: false 
      },
      { 
        title: "Available Dishes", 
        value: availableDishes.length.toString(), 
        percentage: "5%", 
        color: "#285430", 
        isIncrease: true 
      },
      { 
        title: "Spending Records", 
        value: totalSpendingRecords.toString(), 
        percentage: "8%", 
        color: "#735f32", 
        isIncrease: true 
      },
      { 
        title: "Avg Spending", 
        value: formatVND(avgSpendingAmount), 
        percentage: "15%", 
        color: "#7f167f", 
        isIncrease: true 
      }
    ];
  }, [dishes, categories, spendingData]);

  // Get display label for current date filter
  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      case "custom": 
        if (customDateRange.startDate && customDateRange.endDate) {
          return `${customDateRange.startDate} to ${customDateRange.endDate}`;
        }
        return "Custom Range";
      default: return "Today";
    }
  };

  if (ordersLoading || dishesLoading || categoriesLoading || spendingLoading) {
    return (
      <div className="container mx-auto py-2 px-6 md:px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
            <p className="text-[#ababab] text-lg">Loading metrics...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Overall Performance
          </h2>
          <p className="text-sm text-[#ababab]">
            Real-time analytics and performance metrics for your restaurant
          </p>
        </div>
        <div className="bg-[#262626] px-4 py-2 rounded-lg border border-[#343434]">
          <div className="flex items-center gap-2">
            <span className="text-[#ababab] text-sm">Showing data for:</span>
            <span className="text-[#f6b100] font-semibold text-sm">{getDateFilterLabel()}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        {metricsData.map((metric, index) => {
          return (
            <div
              key={index}
              className="shadow-sm rounded-lg p-4"
              style={{ backgroundColor: metric.color }}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium text-xs text-[#f5f5f5]">
                  {metric.title}
                </p>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                  >
                    <path
                      d={metric.isIncrease ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                    />
                  </svg>
                  <p
                    className="font-medium text-xs"
                    style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                  >
                    {metric.percentage}
                  </p>
                </div>
              </div>
              <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col justify-between mt-12">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Restaurant Overview
          </h2>
          <p className="text-sm text-[#ababab]">
            Current status of categories, dishes, and operational metrics
          </p>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-4">

            {
                itemsData.map((item, index) => {
                    return (
                        <div key={index} className="shadow-sm rounded-lg p-4" style={{ backgroundColor: item.color }}>
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-xs text-[#f5f5f5]">{item.title}</p>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4" fill="none">
                              <path d="M5 15l7-7 7 7" />
                            </svg>
                            <p className="font-medium text-xs text-[#f5f5f5]">{item.percentage}</p>
                          </div>
                        </div>
                        <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">{item.value}</p>
                      </div>
                    )
                })
            }

        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-12">
        <div className="mb-8">
          <h2 className="font-semibold text-[#f5f5f5] text-xl mb-2">
            Revenue & Financial Analytics
          </h2>
          <p className="text-sm text-[#ababab]">
            Track revenue trends and financial performance across different categories
          </p>
        </div>

        {/* Revenue Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueTrendChart orders={orders} dateRange={dateFilter} />
          <RevenueByCategoryChart orders={orders} />
        </div>

        {/* Payment Method Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <PaymentMethodChart orders={orders} />
          <div className="lg:col-span-2">
            <TopDishesChart orders={orders} limit={8} />
          </div>
        </div>

        {/* Sales Performance Section */}
        <div className="mb-8">
          <h2 className="font-semibold text-[#f5f5f5] text-xl mb-2">
            Sales Performance & Customer Analytics
          </h2>
          <p className="text-sm text-[#ababab]">
            Analyze sales patterns and customer traffic throughout the day
          </p>
        </div>

        {/* Traffic and Sales Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesHeatmapChart orders={orders} />
          <CustomerTrafficChart orders={orders} />
        </div>

        {/* Third Party Vendor Analytics Section */}
        <div className="mt-12 mb-8">
          <h2 className="font-semibold text-[#f5f5f5] text-xl mb-2">
            Platform & Vendor Analytics
          </h2>
          <p className="text-sm text-[#ababab]">
            Analyze performance across different delivery platforms and direct orders
          </p>
        </div>

        {/* Vendor Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <VendorRevenueChart orders={orders} />
          <VendorOrdersChart orders={orders} />
        </div>

        {/* Vendor Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <VendorTrendChart orders={orders} />
          <VendorPerformanceChart orders={orders} />
        </div>

        {/* Spending Analytics Section */}
        {spendingData && (
          <>
            <div className="mt-12 mb-8">
              <h2 className="font-semibold text-[#f5f5f5] text-xl mb-2">
                Spending & Cost Analytics
              </h2>
              <p className="text-sm text-[#ababab]">
                Track expenses, vendor spending, and cost breakdown by category
              </p>
            </div>

            {/* Spending Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 text-lg">💰</span>
                  </div>
                  <span className="text-[#ababab] text-sm">Total</span>
                </div>
                <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
                  {formatVND(spendingData.summary?.totalAmount || 0)}
                </h3>
                <p className="text-[#ababab] text-sm">Total Spending</p>
              </div>

              <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-lg">📊</span>
                  </div>
                  <span className="text-[#ababab] text-sm">Records</span>
                </div>
                <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
                  {spendingData.summary?.count || 0}
                </h3>
                <p className="text-[#ababab] text-sm">Spending Records</p>
              </div>

              <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <span className="text-yellow-400 text-lg">⏳</span>
                  </div>
                  <span className="text-[#ababab] text-sm">Pending</span>
                </div>
                <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
                  {formatVND(spendingData.paymentStatusBreakdown?.find(item => item._id === 'pending')?.totalAmount || 0)}
                </h3>
                <p className="text-[#ababab] text-sm">Pending Payments</p>
              </div>

              <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-lg">📈</span>
                  </div>
                  <span className="text-[#ababab] text-sm">Average</span>
                </div>
                <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
                  {formatVND(spendingData.summary?.avgAmount || 0)}
                </h3>
                <p className="text-[#ababab] text-sm">Avg per Record</p>
              </div>
            </div>

            {/* Spending Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Spending Categories */}
              <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
                <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Top Spending Categories</h3>
                <div className="space-y-4">
                  {spendingData.spendingByCategory?.slice(0, 5).map((category, index) => (
                    <div key={category._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-[#f5f5f5] font-medium">{category.categoryName}</p>
                          <p className="text-[#ababab] text-sm">{category.count} records</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#f5f5f5] font-semibold">{formatVND(category.totalAmount)}</p>
                        <p className="text-[#ababab] text-xs">Avg: {formatVND(category.avgAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Status Breakdown */}
              <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
                <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Payment Status</h3>
                <div className="space-y-4">
                  {spendingData.paymentStatusBreakdown?.map((status) => (
                    <div key={status._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${
                          status._id === 'paid' ? 'bg-green-500' : 
                          status._id === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-[#f5f5f5] font-medium capitalize">{status._id}</p>
                          <p className="text-[#ababab] text-sm">{status.count} records</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#f5f5f5] font-semibold">{formatVND(status.totalAmount)}</p>
                        <p className="text-[#ababab] text-xs">
                          {((status.totalAmount / (spendingData.summary?.totalAmount || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

Metrics.propTypes = {
  dateFilter: PropTypes.string,
  customDateRange: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
};

export default Metrics;
