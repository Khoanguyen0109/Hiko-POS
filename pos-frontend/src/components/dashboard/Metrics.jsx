import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../redux/slices/orderSlice";
import { fetchDishes } from "../../redux/slices/dishSlice";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchSpendingAnalytics } from "../../redux/slices/spendingSlice";
import { getTodayDate, formatVND } from "../../utils";
import { getDateRangeByPeriodVietnam } from "../../utils/dateUtils";
import PropTypes from "prop-types";
import { Pie } from "react-chartjs-2";
import {
  RevenueTrendChart,
  RevenueByCategoryChart,
  RevenueByDayOfWeekChart,
  PaymentMethodChart,
  TopDishesChart,
  SalesHeatmapChart,
  WeeklyHeatmapChart,
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
  
  // Local state for dish filters
  const [selectedDishId, setSelectedDishId] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [dishSortBy, setDishSortBy] = useState("quantity");

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

  // Helper function to calculate number of days in the selected period
  const calculateDaysInPeriod = useMemo(() => {
    switch (dateFilter) {
      case "today": {
        return 1;
      }
      case "week": {
        return 7;
      }
      case "month": {
        return 30;
      }
      case "custom": {
        if (customDateRange.startDate && customDateRange.endDate) {
          const startDate = new Date(customDateRange.startDate);
          const endDate = new Date(customDateRange.endDate);
          const timeDiff = endDate.getTime() - startDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
          return daysDiff > 0 ? daysDiff : 1;
        }
        return 1;
      }
      default: {
        return 1;
      }
    }
  }, [dateFilter, customDateRange]);

  // Calculate metrics data
  const metricsData = useMemo(() => {
    const completedOrders = orders?.filter(order => order.orderStatus === "completed") || [];
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);
    
    // Calculate average daily revenue
    const averageRevenue = calculateDaysInPeriod > 0 ? totalRevenue / calculateDaysInPeriod : 0;
    
    // Get spending data
    const totalSpending = spendingData?.summary?.totalAmount || 0;
    const spendingCount = spendingData?.summary?.count || 0;
    
    // Calculate profit (revenue - spending)
    const profit = totalRevenue - totalSpending;
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

    // Calculate total quantity of all dishes sold across all orders in date range
    let totalDishesSold = 0;
    orders?.forEach(order => {
      order.items?.forEach(item => {
        totalDishesSold += item.quantity || 0;
      });
    });

    // Calculate average dishes per order
    const totalOrdersCount = orders?.length || 0;
    const avgDishesPerOrder = totalOrdersCount > 0 ? (totalDishesSold / totalOrdersCount).toFixed(1) : 0;

    // Calculate revenue by payment method
    const cashRevenue = completedOrders
      .filter(order => order.paymentMethod === "Cash")
      .reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);
    
    const bankingRevenue = completedOrders
      .filter(order => order.paymentMethod === "Banking")
      .reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);

    // Calculate revenue by third-party vendors
    const thirdPartyVendorRevenue = completedOrders
      .filter(order => order.thirdPartyVendor && order.thirdPartyVendor !== "None")
      .reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);

    // Calculate percentages
    const cashPercentage = totalRevenue > 0 ? ((cashRevenue / totalRevenue) * 100).toFixed(1) : 0;
    const bankingPercentage = totalRevenue > 0 ? ((bankingRevenue / totalRevenue) * 100).toFixed(1) : 0;
    const vendorPercentage = totalRevenue > 0 ? ((thirdPartyVendorRevenue / totalRevenue) * 100).toFixed(1) : 0;

    return [
      { 
        title: "Revenue", 
        value: formatVND(totalRevenue), 
        percentage: "12%", 
        color: "#025cca", 
        isIncrease: true 
      },
      { 
        title: "Avg Daily Revenue", 
        value: formatVND(averageRevenue), 
        percentage: `${calculateDaysInPeriod} day${calculateDaysInPeriod !== 1 ? 's' : ''}`, 
        color: "#10B981", 
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
      { 
        title: "Total Dishes Sold", 
        value: totalDishesSold.toString(), 
        percentage: "8%", 
        color: "#1e5a8e", 
        isIncrease: true 
      },
      { 
        title: "Avg Dishes/Order", 
        value: avgDishesPerOrder.toString(), 
        percentage: "items", 
        color: "#8b5cf6", 
        isIncrease: true 
      },
      { 
        title: "Cash Revenue", 
        value: formatVND(cashRevenue), 
        percentage: `${cashPercentage}%`, 
        color: "#10B981", 
        isIncrease: true 
      },
      { 
        title: "Banking Revenue", 
        value: formatVND(bankingRevenue), 
        percentage: `${bankingPercentage}%`, 
        color: "#8B5CF6", 
        isIncrease: true 
      },
      { 
        title: "3rd Party Vendors", 
        value: formatVND(thirdPartyVendorRevenue), 
        percentage: `${vendorPercentage}%`, 
        color: "#F59E0B", 
        isIncrease: true 
      },
    ];
  }, [orders, spendingData, calculateDaysInPeriod]);

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
    <div className="container mx-auto py-2 px-4 sm:px-6">
      {/* Overall Performance Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-lg sm:text-xl">
            Overall Performance
          </h2>
          <p className="text-xs sm:text-sm text-[#ababab]">
            Real-time analytics and performance metrics for your restaurant
          </p>
        </div>
        {/* Date Filter Display - Hidden on mobile, shown on tablet+ */}
        <div className="hidden sm:block bg-[#262626] px-3 sm:px-4 py-2 rounded-lg border border-[#343434]">
          <div className="flex items-center gap-2">
            <span className="text-[#ababab] text-xs sm:text-sm">Showing data for:</span>
            <span className="text-[#f6b100] font-semibold text-xs sm:text-sm">{getDateFilterLabel()}</span>
          </div>
        </div>
        {/* Mobile Date Badge */}
        <div className="sm:hidden">
          <span className="inline-block bg-[#f6b100] text-[#1f1f1f] px-3 py-1 rounded-full text-xs font-semibold">
            {getDateFilterLabel()}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Restaurant Overview Section */}
      <div className="mt-8 sm:mt-10 lg:mt-12">
        <div className="mb-4 sm:mb-6">
          <h2 className="font-semibold text-[#f5f5f5] text-lg sm:text-xl">
            Restaurant Overview
          </h2>
          <p className="text-xs sm:text-sm text-[#ababab]">
            Current status of categories, dishes, and operational metrics
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

            {itemsData.map((item, index) => {
              return (
                <div 
                  key={index} 
                  className="shadow-sm rounded-lg p-3 sm:p-4" 
                  style={{ backgroundColor: item.color }}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-xs text-[#f5f5f5] leading-tight pr-1">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      <svg 
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none"
                      >
                        <path d="M5 15l7-7 7 7" />
                      </svg>
                      <p className="font-medium text-[10px] sm:text-xs text-[#f5f5f5]">
                        {item.percentage}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1.5 sm:mt-2 font-semibold text-xl sm:text-2xl text-[#f5f5f5]">
                    {item.value}
                  </p>
                </div>
              );
            })}

        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-8 sm:mt-10 lg:mt-12">
        <div className="mb-6 sm:mb-8">
          <h2 className="font-semibold text-[#f5f5f5] text-lg sm:text-xl mb-1 sm:mb-2">
            Revenue & Financial Analytics
          </h2>
          <p className="text-xs sm:text-sm text-[#ababab]">
            Track revenue trends and financial performance across different categories
          </p>
        </div>

        {/* Revenue Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <RevenueTrendChart orders={orders} dateRange={dateFilter} />
          <RevenueByCategoryChart orders={orders} />
        </div>

        {/* Revenue by Day of Week Chart - Full Width */}
        <div className="mb-6 sm:mb-8">
          <RevenueByDayOfWeekChart orders={orders} dateRange={dateFilter} />
        </div>

        {/* Payment Method Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
          <PaymentMethodChart orders={orders} />
          <div className="lg:col-span-2">
            <TopDishesChart orders={orders} />
          </div>
        </div>

        {/* Sales Performance Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="font-semibold text-[#f5f5f5] text-lg sm:text-xl mb-1 sm:mb-2">
            Sales Performance & Customer Analytics
          </h2>
          <p className="text-xs sm:text-sm text-[#ababab]">
            Analyze sales patterns and customer traffic throughout the day
          </p>
        </div>

        {/* Traffic and Sales Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <SalesHeatmapChart orders={orders} />
          <CustomerTrafficChart orders={orders} />
        </div>

        {/* Weekly Traffic Heatmap - Full Width */}
        <div className="mb-6 sm:mb-8">
          <WeeklyHeatmapChart orders={orders} dateRange={dateFilter} />
        </div>

        {/* Third Party Vendor Analytics Section */}
        <div className="mt-8 sm:mt-10 lg:mt-12 mb-6 sm:mb-8">
          <h2 className="font-semibold text-[#f5f5f5] text-lg sm:text-xl mb-1 sm:mb-2">
            Platform & Vendor Analytics
          </h2>
          <p className="text-xs sm:text-sm text-[#ababab]">
            Analyze performance across different delivery platforms and direct orders
          </p>
        </div>

        {/* Vendor Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <VendorRevenueChart orders={orders} />
          <VendorOrdersChart orders={orders} />
        </div>

        {/* Vendor Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <VendorTrendChart orders={orders} />
          <VendorPerformanceChart orders={orders} />
        </div>

        {/* Dish Analytics Section */}
        <div className="mt-8 sm:mt-10 lg:mt-12 mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="font-semibold text-[#f5f5f5] text-lg sm:text-xl mb-1 sm:mb-2">
              Dish Performance Analytics
            </h2>
            <p className="text-xs sm:text-sm text-[#ababab]">
              Analyze individual dish performance and order distribution
            </p>
          </div>

          {/* Filters Panel */}
          <div className="bg-[#262626] rounded-lg p-4 border border-[#343434] mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Dish Filter */}
              <div>
                <label className="block text-[#ababab] text-xs mb-2">Select Dish</label>
                <select
                  value={selectedDishId}
                  onChange={(e) => setSelectedDishId(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] px-3 py-2 rounded-lg border border-[#343434] focus:outline-none focus:border-[#f6b100] transition-colors text-xs sm:text-sm"
                >
                  <option value="all">All Dishes</option>
                  {dishes?.map((dish) => (
                    <option key={dish._id} value={dish._id}>
                      {dish.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[#ababab] text-xs mb-2">Filter by Category</label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] px-3 py-2 rounded-lg border border-[#343434] focus:outline-none focus:border-[#f6b100] transition-colors text-xs sm:text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories?.filter(cat => cat.isActive).map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Status Filter */}
              <div>
                <label className="block text-[#ababab] text-xs mb-2">Filter by Status</label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] px-3 py-2 rounded-lg border border-[#343434] focus:outline-none focus:border-[#f6b100] transition-colors text-xs sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[#ababab] text-xs mb-2">Sort By</label>
                <select
                  value={dishSortBy}
                  onChange={(e) => setDishSortBy(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] px-3 py-2 rounded-lg border border-[#343434] focus:outline-none focus:border-[#f6b100] transition-colors text-xs sm:text-sm"
                >
                  <option value="quantity">Highest Quantity</option>
                  <option value="revenue">Highest Revenue</option>
                  <option value="orders">Most Orders</option>
                  <option value="name">Dish Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedDishId !== "all" || selectedCategoryFilter !== "all" || selectedStatusFilter !== "all") && (
              <div className="mt-3 pt-3 border-t border-[#343434]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[#ababab] text-xs">Active Filters:</span>
                  {selectedDishId !== "all" && (
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-xs border border-blue-500/30">
                      Dish: {dishes?.find(d => d._id === selectedDishId)?.name}
                    </span>
                  )}
                  {selectedCategoryFilter !== "all" && (
                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md text-xs border border-purple-500/30">
                      Category: {categories?.find(c => c._id === selectedCategoryFilter)?.name}
                    </span>
                  )}
                  {selectedStatusFilter !== "all" && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs border border-green-500/30">
                      Status: {selectedStatusFilter.charAt(0).toUpperCase() + selectedStatusFilter.slice(1)}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedDishId("all");
                      setSelectedCategoryFilter("all");
                      setSelectedStatusFilter("all");
                    }}
                    className="text-red-400 hover:text-red-300 text-xs underline ml-2"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dish Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {(() => {
              // Apply all filters to orders
              let filteredOrders = orders;

              // Filter by order status
              if (selectedStatusFilter !== "all") {
                filteredOrders = filteredOrders?.filter(order => order.orderStatus === selectedStatusFilter);
              }

              // Filter by dish or category
              if (selectedDishId !== "all") {
                filteredOrders = filteredOrders?.filter(order => 
                  order.items?.some(item => {
                    const dishId = typeof item.dishId === 'object' ? item.dishId._id : item.dishId;
                    return dishId === selectedDishId;
                  })
                );
              } else if (selectedCategoryFilter !== "all") {
                filteredOrders = filteredOrders?.filter(order => 
                  order.items?.some(item => {
                    const categoryId = typeof item.dishId === 'object' && item.dishId.category 
                      ? (typeof item.dishId.category === 'object' ? item.dishId.category._id : item.dishId.category)
                      : item.category;
                    return categoryId === selectedCategoryFilter || item.category === categories?.find(c => c._id === selectedCategoryFilter)?.name;
                  })
                );
              }

              // Calculate metrics based on filtered orders
              let totalQuantity = 0;
              let totalRevenue = 0;
              let orderCount = filteredOrders?.length || 0;

              filteredOrders?.forEach(order => {
                order.items?.forEach(item => {
                  // Check if item matches filters
                  const dishId = typeof item.dishId === 'object' ? item.dishId._id : item.dishId;
                  const categoryId = typeof item.dishId === 'object' && item.dishId.category 
                    ? (typeof item.dishId.category === 'object' ? item.dishId.category._id : item.dishId.category)
                    : item.category;
                  const categoryName = categories?.find(c => c._id === selectedCategoryFilter)?.name;

                  let includeItem = true;

                  // Check dish filter
                  if (selectedDishId !== "all" && dishId !== selectedDishId) {
                    includeItem = false;
                  }

                  // Check category filter
                  if (selectedCategoryFilter !== "all" && selectedDishId === "all") {
                    if (categoryId !== selectedCategoryFilter && item.category !== categoryName) {
                      includeItem = false;
                    }
                  }

                  if (includeItem) {
                    totalQuantity += item.quantity || 0;
                    totalRevenue += item.price || 0;
                  }
                });
              });

              const avgQuantityPerOrder = orderCount > 0 ? (totalQuantity / orderCount).toFixed(1) : 0;

              return (
                <>
                  <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-base sm:text-lg">📦</span>
                      </div>
                      <span className="text-[#ababab] text-xs">Total</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
                      {totalQuantity}
                    </h3>
                    <p className="text-[#ababab] text-xs sm:text-sm">Dishes Sold</p>
                  </div>

                  <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-400 text-base sm:text-lg">💰</span>
                      </div>
                      <span className="text-[#ababab] text-xs">Revenue</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
                      {formatVND(totalRevenue)}
                    </h3>
                    <p className="text-[#ababab] text-xs sm:text-sm">Total Revenue</p>
                  </div>

                  <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 text-base sm:text-lg">📋</span>
                      </div>
                      <span className="text-[#ababab] text-xs">Orders</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
                      {orderCount}
                    </h3>
                    <p className="text-[#ababab] text-xs sm:text-sm">Total Orders</p>
                  </div>

                  <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-purple-400 text-base sm:text-lg">📊</span>
                      </div>
                      <span className="text-[#ababab] text-xs">Average</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
                      {avgQuantityPerOrder}
                    </h3>
                    <p className="text-[#ababab] text-xs sm:text-sm">Avg per Order</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Dish Orders Pie Chart */}
          <div className="bg-[#262626] rounded-lg p-4 sm:p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-4">
              {selectedDishId === "all" ? "Top Dishes Distribution" : "Order Distribution"}
            </h3>
            {(() => {
              // Apply filters to orders for chart
              let filteredChartOrders = orders;

              // Filter by order status
              if (selectedStatusFilter !== "all") {
                filteredChartOrders = filteredChartOrders?.filter(order => order.orderStatus === selectedStatusFilter);
              }

              // Prepare pie chart data
              let chartData;
              
              if (selectedDishId === "all") {
                // Show top dishes with filters applied
                const dishSales = {};
                const categoryName = categories?.find(c => c._id === selectedCategoryFilter)?.name;
                
                filteredChartOrders?.forEach(order => {
                  order.items?.forEach(item => {
                    const dishId = typeof item.dishId === 'object' ? item.dishId._id : item.dishId;
                    const dishName = item.name;
                    const categoryId = typeof item.dishId === 'object' && item.dishId.category 
                      ? (typeof item.dishId.category === 'object' ? item.dishId.category._id : item.dishId.category)
                      : item.category;
                    
                    // Apply category filter if set
                    if (selectedCategoryFilter !== "all") {
                      if (categoryId !== selectedCategoryFilter && item.category !== categoryName) {
                        return; // Skip this item
                      }
                    }
                    
                    if (!dishSales[dishId]) {
                      dishSales[dishId] = { 
                        name: dishName, 
                        quantity: 0, 
                        revenue: 0, 
                        orders: new Set() 
                      };
                    }
                    dishSales[dishId].quantity += item.quantity || 0;
                    dishSales[dishId].revenue += item.price || 0;
                    dishSales[dishId].orders.add(order._id);
                  });
                });

                // Convert orders Set to count
                Object.values(dishSales).forEach(dish => {
                  dish.orderCount = dish.orders.size;
                  delete dish.orders;
                });

                // Sort based on selected sort option
                let sortedDishes = Object.values(dishSales);
                switch (dishSortBy) {
                  case "quantity":
                    sortedDishes.sort((a, b) => b.quantity - a.quantity);
                    break;
                  case "revenue":
                    sortedDishes.sort((a, b) => b.revenue - a.revenue);
                    break;
                  case "orders":
                    sortedDishes.sort((a, b) => b.orderCount - a.orderCount);
                    break;
                  case "name":
                    sortedDishes.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                  default:
                    sortedDishes.sort((a, b) => b.quantity - a.quantity);
                }

                const topDishes = sortedDishes.slice(0, 10);

                chartData = {
                  labels: topDishes.map(d => d.name),
                  datasets: [{
                    data: topDishes.map(d => d.quantity),
                    backgroundColor: [
                      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
                    ],
                    borderColor: '#1f1f1f',
                    borderWidth: 2,
                  }]
                };
              } else {
                // Show order status distribution for selected dish
                const statusCounts = { completed: 0, pending: 0, progress: 0, ready: 0, cancelled: 0 };
                filteredChartOrders?.forEach(order => {
                  const hasDish = order.items?.some(item => {
                    const dishId = typeof item.dishId === 'object' ? item.dishId._id : item.dishId;
                    return dishId === selectedDishId;
                  });
                  if (hasDish) {
                    statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
                  }
                });

                chartData = {
                  labels: Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                  datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'],
                    borderColor: '#1f1f1f',
                    borderWidth: 2,
                  }]
                };
              }

              const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#f5f5f5',
                      padding: 15,
                      font: { size: 12 }
                    }
                  },
                  tooltip: {
                    backgroundColor: '#1f1f1f',
                    titleColor: '#f5f5f5',
                    bodyColor: '#f5f5f5',
                    borderColor: '#343434',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              };

              return (
                <div style={{ height: '400px' }}>
                  <Pie data={chartData} options={options} />
                </div>
              );
            })()}
          </div>
        </div>

        {/* Spending Analytics Section */}
        {spendingData && (
          <>
            <div className="mt-8 sm:mt-10 lg:mt-12 mb-6 sm:mb-8">
              <h2 className="font-semibold text-[#f5f5f5] text-lg sm:text-xl mb-1 sm:mb-2">
                Spending & Cost Analytics
              </h2>
              <p className="text-xs sm:text-sm text-[#ababab]">
                Track expenses, vendor spending, and cost breakdown by category
              </p>
            </div>

            {/* Spending Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 text-base sm:text-lg">💰</span>
                  </div>
                  <span className="text-[#ababab] text-xs sm:text-sm">Total</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
                  {formatVND(spendingData.summary?.totalAmount || 0)}
                </h3>
                <p className="text-[#ababab] text-xs sm:text-sm">Total Spending</p>
              </div>

              <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-base sm:text-lg">📊</span>
                  </div>
                  <span className="text-[#ababab] text-xs sm:text-sm">Records</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
                  {spendingData.summary?.count || 0}
                </h3>
                <p className="text-[#ababab] text-xs sm:text-sm">Spending Records</p>
              </div>

              <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <span className="text-yellow-400 text-base sm:text-lg">⏳</span>
                  </div>
                  <span className="text-[#ababab] text-xs sm:text-sm">Pending</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
                  {formatVND(spendingData.paymentStatusBreakdown?.find(item => item._id === 'pending')?.totalAmount || 0)}
                </h3>
                <p className="text-[#ababab] text-xs sm:text-sm">Pending Payments</p>
              </div>

              <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-base sm:text-lg">📈</span>
                  </div>
                  <span className="text-[#ababab] text-xs sm:text-sm">Average</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
                  {formatVND(spendingData.summary?.avgAmount || 0)}
                </h3>
                <p className="text-[#ababab] text-xs sm:text-sm">Avg per Record</p>
              </div>
            </div>

            {/* Spending Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Top Spending Categories */}
              <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-3 sm:mb-4">
                  Top Spending Categories
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {spendingData.spendingByCategory?.slice(0, 5).map((category, index) => (
                    <div key={category._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#f5f5f5] font-medium text-sm sm:text-base truncate">
                            {category.categoryName}
                          </p>
                          <p className="text-[#ababab] text-xs sm:text-sm">
                            {category.count} records
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-[#f5f5f5] font-semibold text-sm sm:text-base whitespace-nowrap">
                          {formatVND(category.totalAmount)}
                        </p>
                        <p className="text-[#ababab] text-xs">
                          Avg: {formatVND(category.avgAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Status Breakdown */}
              <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-3 sm:mb-4">
                  Payment Status
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {spendingData.paymentStatusBreakdown?.map((status) => (
                    <div key={status._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${
                          status._id === 'paid' ? 'bg-green-500' : 
                          status._id === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div className="min-w-0">
                          <p className="text-[#f5f5f5] font-medium capitalize text-sm sm:text-base">
                            {status._id}
                          </p>
                          <p className="text-[#ababab] text-xs sm:text-sm">
                            {status.count} records
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-[#f5f5f5] font-semibold text-sm sm:text-base whitespace-nowrap">
                          {formatVND(status.totalAmount)}
                        </p>
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
