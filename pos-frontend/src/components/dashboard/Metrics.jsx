import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../redux/slices/orderSlice";
import { fetchDishes } from "../../redux/slices/dishSlice";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { getTodayDate, formatVND } from "../../utils";
import PropTypes from "prop-types";
import {
  RevenueTrendChart,
  RevenueByCategoryChart,
  PaymentMethodChart,
  TopDishesChart,
  SalesHeatmapChart,
  CustomerTrafficChart
} from "../charts";

const Metrics = ({ dateFilter = "today", customDateRange = { startDate: "", endDate: "" } }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const { items: orders, loading: ordersLoading } = useSelector((state) => state.orders);
  const { items: dishes, loading: dishesLoading } = useSelector((state) => state.dishes);
  const { items: categories, loading: categoriesLoading } = useSelector((state) => state.categories);

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
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today;
        break;
      }
      case "month": {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
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
  }, [dispatch, dateFilter, customDateRange]);

  // Calculate metrics data
  const metricsData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [
        { title: "Revenue", value: formatVND(0), percentage: "0%", color: "#025cca", isIncrease: false },
        { title: "Total Orders", value: "0", percentage: "0%", color: "#02ca3a", isIncrease: true },
        { title: "Completed Orders", value: "0", percentage: "0%", color: "#f6b100", isIncrease: true },
        { title: "Average Order Value", value: formatVND(0), percentage: "0%", color: "#be3e3f", isIncrease: false },
      ];
    }

    const completedOrders = orders.filter(order => order.orderStatus === "completed");
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    return [
      { 
        title: "Revenue", 
        value: formatVND(totalRevenue), 
        percentage: "12%", 
        color: "#025cca", 
        isIncrease: true 
      },
      { 
        title: "Total Orders", 
        value: orders.length.toString(), 
        percentage: "16%", 
        color: "#02ca3a", 
        isIncrease: true 
      },
      { 
        title: "Completed Orders", 
        value: completedOrders.length.toString(), 
        percentage: "10%", 
        color: "#f6b100", 
        isIncrease: true 
      },
      { 
        title: "Average Order Value", 
        value: formatVND(averageOrderValue), 
        percentage: "8%", 
        color: "#be3e3f", 
        isIncrease: false 
      },
    ];
  }, [orders]);

  // Calculate items data
  const itemsData = useMemo(() => {
    const activeCategories = categories.filter(cat => cat.isActive);
    const availableDishes = dishes.filter(dish => dish.isAvailable);
    const activeOrders = orders.filter(order => 
      order.orderStatus === "progress" || order.orderStatus === "preparing"
    );
    
    const totalDishesOrdered = orders.reduce((sum, order) => {
      if (order.items && Array.isArray(order.items)) {
        return sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
      }
      return sum;
    }, 0);

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
        title: "Active Orders", 
        value: activeOrders.length.toString(), 
        percentage: "8%", 
        color: "#735f32", 
        isIncrease: true 
      },
      { 
        title: "Dishes Ordered", 
        value: totalDishesOrdered.toString(), 
        percentage: "15%", 
        color: "#7f167f", 
        isIncrease: true 
      }
    ];
  }, [orders, dishes, categories]);

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

  if (ordersLoading || dishesLoading || categoriesLoading) {
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
