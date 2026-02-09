import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { MdCategory, MdDateRange, MdToday, MdCalendarMonth, MdLocalOffer, MdAccountBalanceWallet, MdAnalytics, MdPayment, MdReceipt, MdStorage, MdBusiness } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { MdAddCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ROUTES } from "../constants";
import Metrics from "../components/dashboard/Metrics";
import PromotionMetrics from "../components/dashboard/PromotionMetrics";
import SalaryMetrics from "../components/dashboard/SalaryMetrics";
import StorageAnalytics from "../components/dashboard/StorageAnalytics";
import CategoryModal from "../components/dashboard/CategoryModal";
import DishModal from "../components/dashboard/DishModal";
import { getStoredUser } from "../utils/auth";
import { formatVND } from "../utils";
import { fetchSpendingDashboard } from "../redux/slices/spendingSlice";

// Spending Analytics Component
const SpendingAnalytics = ({ dashboardData, loading, error }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
        <p className="text-[#ababab] text-lg">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <MdAnalytics className="mx-auto text-6xl text-red-500 mb-4" />
        <p className="text-red-400 text-lg mb-2">Error loading analytics</p>
        <p className="text-[#ababab] text-sm">{error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <MdAnalytics className="mx-auto text-6xl text-[#ababab] mb-4" />
        <p className="text-[#ababab] text-lg">No analytics data available</p>
        <p className="text-[#ababab] text-sm mt-2">Try creating some spending records first</p>
      </div>
    );
  }

  const { summary, spendingByCategory, spendingByVendor, monthlyTrend, paymentStatusBreakdown } = dashboardData;

  return (
    <div className="container mx-auto px-4 md:px-6">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <MdAccountBalanceWallet className="text-xl sm:text-2xl text-[#f6b100]" />
              <span className="text-[#ababab] text-xs sm:text-sm">This Month</span>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
              {formatVND(summary?.totalAmount || 0)}
            </h3>
            <p className="text-[#ababab] text-xs sm:text-sm">Total Spending</p>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <MdReceipt className="text-xl sm:text-2xl text-[#10B981]" />
              <span className="text-[#ababab] text-xs sm:text-sm">This Month</span>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
              {summary?.count || 0}
            </h3>
            <p className="text-[#ababab] text-xs sm:text-sm">Total Records</p>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <MdPayment className="text-xl sm:text-2xl text-[#EF4444]" />
              <span className="text-[#ababab] text-xs sm:text-sm">Pending</span>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
              {formatVND(paymentStatusBreakdown?.find(item => item._id === 'pending')?.totalAmount || 0)}
            </h3>
            <p className="text-[#ababab] text-xs sm:text-sm">Pending Payments</p>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <MdDateRange className="text-xl sm:text-2xl text-[#8B5CF6]" />
              <span className="text-[#ababab] text-xs sm:text-sm">This Year</span>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
              {formatVND(monthlyTrend?.[0]?.totalAmount || 0)}
            </h3>
            <p className="text-[#ababab] text-xs sm:text-sm">Period Total</p>
          </div>
        </div>

        {/* Payment Status & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-3 sm:mb-4">Payment Status</h3>
            <div className="space-y-2 sm:space-y-3">
              {paymentStatusBreakdown?.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f5f5f5] font-medium capitalize text-sm sm:text-base truncate">{item._id}</p>
                    <p className="text-[#ababab] text-xs sm:text-sm">{item.count} records</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-[#f5f5f5] font-semibold text-sm sm:text-base">{formatVND(item.totalAmount)}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                      item._id === 'paid' ? 'bg-green-500' : 
                      item._id === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-3 sm:mb-4">Top Categories</h3>
            <div className="space-y-2 sm:space-y-3">
              {spendingByCategory?.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[#f5f5f5] font-medium text-sm sm:text-base truncate">{item.categoryName}</p>
                    <p className="text-[#ababab] text-xs sm:text-sm">{item.count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f5f5f5] font-semibold text-sm sm:text-base whitespace-nowrap">{formatVND(item.totalAmount)}</p>
                    <p className="text-[#ababab] text-xs">Avg: {formatVND(item.avgAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Vendors & Monthly Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-3 sm:mb-4">Top Vendors</h3>
            <div className="space-y-2 sm:space-y-3">
              {spendingByVendor?.length > 0 ? spendingByVendor.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[#f5f5f5] font-medium text-sm sm:text-base truncate">{item.vendorName}</p>
                    <p className="text-[#ababab] text-xs sm:text-sm">{item.count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f5f5f5] font-semibold text-sm sm:text-base whitespace-nowrap">{formatVND(item.totalAmount)}</p>
                    <p className="text-[#ababab] text-xs">Avg: {formatVND(item.avgAmount)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-[#ababab] text-center py-4 text-sm">No vendor data available</p>
              )}
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-3 sm:mb-4">Monthly Trend</h3>
            <div className="space-y-2 sm:space-y-3">
              {monthlyTrend?.map((item) => (
                <div key={`${item._id.year}-${item._id.month}`} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[#f5f5f5] font-medium text-sm sm:text-base">
                      {new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: window.innerWidth < 640 ? 'short' : 'long',
                        timeZone: 'Asia/Ho_Chi_Minh'
                      })}
                    </p>
                    <p className="text-[#ababab] text-xs sm:text-sm">{item.count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f5f5f5] font-semibold text-sm sm:text-base whitespace-nowrap">{formatVND(item.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SpendingAnalytics.propTypes = {
  dashboardData: PropTypes.shape({
    summary: PropTypes.shape({
      totalAmount: PropTypes.number,
      count: PropTypes.number
    }),
    spendingByCategory: PropTypes.arrayOf(PropTypes.object),
    spendingByVendor: PropTypes.arrayOf(PropTypes.object),
    monthlyTrend: PropTypes.arrayOf(PropTypes.object),
    paymentStatusBreakdown: PropTypes.arrayOf(PropTypes.object)
  }),
  loading: PropTypes.bool,
  error: PropTypes.string
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = getStoredUser();
  const isAdmin = user?.role === "Admin";
  

  // Redux state for spending analytics
  const { dashboardData, dashboardLoading, dashboardError } = useSelector((state) => state.spending);

  const buttons = [
    { label: "Add Category", icon: <MdCategory />, action: "category" },
    { label: "Add Dishes", icon: <BiSolidDish />, action: "dishes" },
    { label: "Add Topping", icon: <MdAddCircle />, action: "topping" },
    { label: "Add Promotion", icon: <MdLocalOffer />, action: "promotion" },
    { label: "Storage", icon: <MdStorage />, action: "storage" },
    ...(isAdmin ? [
      { label: "Spending", icon: <MdAccountBalanceWallet />, action: "spending" },
      { label: "Suppliers", icon: <MdBusiness />, action: "suppliers" }
    ] : []),
  ];

  const tabs = ["Metrics", "Promotions", ...(isAdmin ? ["Spending", "Salary", "Storage Analytics"] : [])];

  const dateFilterOptions = [
    { value: "today", label: "Today", icon: <MdToday /> },
    { value: "week", label: "This Week", icon: <MdDateRange /> },
    { value: "month", label: "This Month", icon: <MdCalendarMonth /> },
    { value: "custom", label: "Custom Range", icon: <MdDateRange /> },
  ];
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDishesModalOpen, setIsDishesModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Metrics");
  const [dateFilter, setDateFilter] = useState("today");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    document.title = "POS | Admin Dashboard";
  }, []);

  // Load spending dashboard data when Spending tab is active and user is admin
  useEffect(() => {
    if (isAdmin && activeTab === "Spending") {
      // Prepare date filter parameters
      const params = {};
      
      if (dateFilter === "custom" && customDateRange.startDate && customDateRange.endDate) {
        params.startDate = customDateRange.startDate;
        params.endDate = customDateRange.endDate;
      } else if (dateFilter !== "custom") {
        params.period = dateFilter; // today, week, month
      }
      
      dispatch(fetchSpendingDashboard(params));
    }
  }, [dispatch, isAdmin, activeTab, dateFilter, customDateRange]);

  const handleOpenModal = (action) => {
    if (action === "category") setIsCategoryModalOpen(true);
    if (action === "dishes") setIsDishesModalOpen(true);
    if (action === "topping") navigate(ROUTES.TOPPINGS);
    if (action === "promotion") navigate(ROUTES.PROMOTIONS);
    if (action === "spending") navigate(ROUTES.SPENDING);
    if (action === "storage") navigate(ROUTES.STORAGE);
    if (action === "suppliers") navigate(ROUTES.SUPPLIERS);
  };

  const handleDateFilterChange = (filterValue) => {
    setDateFilter(filterValue);
    if (filterValue !== "custom") {
      setCustomDateRange({ startDate: "", endDate: "" });
    }
  };

  const handleCustomDateChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-[#1f1f1f] pb-20 min-h-screen">
      {/* Header Section with Action Buttons and Tabs */}
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 md:px-6">
        {/* Title - Mobile Only */}
        <div className="mb-4 lg:hidden">
          <h1 className="text-xl font-bold text-[#f5f5f5]">Dashboard</h1>
          <p className="text-[#ababab] text-sm mt-1">Manage your restaurant</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-4">
          <h2 className="text-[#ababab] text-xs uppercase tracking-wider mb-2 lg:hidden">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
            {buttons.map(({ label, icon, action }) => {
              return (
                <button
                  key={action}
                  onClick={() => handleOpenModal(action)}
                  className="bg-[#1a1a1a] hover:bg-[#262626] px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-[#f5f5f5] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {icon}
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#343434]">
          <h2 className="text-[#ababab] text-xs uppercase tracking-wider mb-2 lg:hidden">View</h2>
          <div className="flex gap-1 overflow-x-auto pb-2 -mb-px scrollbar-hide">
            {tabs.map((tab) => {
              return (
                <button
                  key={tab}
                  className={`
                    px-4 py-2.5 sm:px-6 sm:py-3 rounded-t-lg text-[#f5f5f5] font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeTab === tab
                        ? "bg-[#262626] border-b-2 border-[#f6b100]"
                        : "bg-[#1a1a1a] hover:bg-[#262626]"
                    }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="container mx-auto px-4 md:px-6 mb-4 sm:mb-6">
        <div className="bg-[#1a1a1a] rounded-lg p-3 sm:p-4 border border-[#343434]">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Title */}
            <div>
              <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">Date Filter</h3>
              <p className="text-[#ababab] text-xs sm:text-sm">Filter data by time period</p>
            </div>
            
            {/* Date Filter Buttons - Mobile: 2x2 Grid, Tablet+: Horizontal */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {dateFilterOptions.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => handleDateFilterChange(value)}
                  className={`
                    flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors
                    ${dateFilter === value
                      ? "bg-[#f6b100] text-[#1f1f1f]"
                      : "bg-[#262626] text-[#f5f5f5] hover:bg-[#343434]"
                    }
                  `}
                >
                  <span className="text-base sm:text-lg">{icon}</span>
                  <span className="hidden xs:inline sm:inline">{label}</span>
                  <span className="xs:hidden">{label.split(' ').pop()}</span>
                </button>
              ))}
            </div>

            {/* Custom Date Range Inputs */}
            {dateFilter === "custom" && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#343434]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="flex flex-col">
                    <label className="text-[#ababab] text-xs mb-1.5">From Date</label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => handleCustomDateChange("startDate", e.target.value)}
                      className="bg-[#262626] text-[#f5f5f5] border border-[#343434] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f6b100] w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[#ababab] text-xs mb-1.5">To Date</label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => handleCustomDateChange("endDate", e.target.value)}
                      className="bg-[#262626] text-[#f5f5f5] border border-[#343434] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f6b100] w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "Metrics" && (
        <Metrics 
          dateFilter={dateFilter}
          customDateRange={customDateRange}
        />
      )}
      {activeTab === "Promotions" && (
        <div className="container mx-auto px-4 md:px-6">
          <PromotionMetrics 
            dateFilter={dateFilter}
            customDateRange={customDateRange}
          />
        </div>
      )}
      {activeTab === "Spending" && isAdmin && (
        <SpendingAnalytics 
          dashboardData={dashboardData}
          loading={dashboardLoading}
          error={dashboardError}
        />
      )}
      {activeTab === "Salary" && isAdmin && (
        <div className="container mx-auto px-4 md:px-6">
          <SalaryMetrics 
            dateFilter={dateFilter}
            customDateRange={customDateRange}
          />
        </div>
      )}

      {activeTab === "Storage Analytics" && isAdmin && (
        <StorageAnalytics 
          dateFilter={dateFilter}
          customDateRange={customDateRange}
        />
      )}

      {isCategoryModalOpen && <CategoryModal setIsCategoryModalOpen={setIsCategoryModalOpen} />}
      {isDishesModalOpen && <DishModal setIsDishesModalOpen={setIsDishesModalOpen} />}
    </div>
  );
};

export default Dashboard;
