import { useState, useEffect } from "react";
import { MdCategory, MdDateRange, MdToday, MdCalendarMonth, MdLocalOffer, MdAccountBalanceWallet, MdAnalytics, MdPayment, MdReceipt } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { MdAddCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ROUTES } from "../constants";
import Metrics from "../components/dashboard/Metrics";
import PromotionMetrics from "../components/dashboard/PromotionMetrics";
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

  const { summary, spendingByCategory, spendingByVendor, monthlyTrend, paymentStatusBreakdown, overdueSpending } = dashboardData;

  return (
    <div className="container mx-auto px-4 md:px-6">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <div className="flex items-center justify-between mb-4">
              <MdAccountBalanceWallet className="text-2xl text-[#f6b100]" />
              <span className="text-[#ababab] text-sm">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
              {formatVND(summary?.totalAmount || 0)}
            </h3>
            <p className="text-[#ababab] text-sm">Total Spending</p>
          </div>

          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <div className="flex items-center justify-between mb-4">
              <MdReceipt className="text-2xl text-[#10B981]" />
              <span className="text-[#ababab] text-sm">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
              {summary?.count || 0}
            </h3>
            <p className="text-[#ababab] text-sm">Total Records</p>
          </div>

          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <div className="flex items-center justify-between mb-4">
              <MdPayment className="text-2xl text-[#EF4444]" />
              <span className="text-[#ababab] text-sm">Pending</span>
            </div>
            <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
              {formatVND(paymentStatusBreakdown?.find(item => item._id === 'pending')?.totalAmount || 0)}
            </h3>
            <p className="text-[#ababab] text-sm">Pending Payments</p>
          </div>

          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <div className="flex items-center justify-between mb-4">
              <MdDateRange className="text-2xl text-[#8B5CF6]" />
              <span className="text-[#ababab] text-sm">This Year</span>
            </div>
            <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
              {formatVND(monthlyTrend?.[0]?.totalAmount || 0)}
            </h3>
            <p className="text-[#ababab] text-sm">Period Total</p>
          </div>
        </div>

        {/* Payment Status & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Payment Status</h3>
            <div className="space-y-3">
              {paymentStatusBreakdown?.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                  <div>
                    <p className="text-[#f5f5f5] font-medium capitalize">{item._id}</p>
                    <p className="text-[#ababab] text-sm">{item.count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f5f5f5] font-semibold">{formatVND(item.totalAmount)}</p>
                    <div className={`w-3 h-3 rounded-full inline-block ml-2 ${
                      item._id === 'paid' ? 'bg-green-500' : 
                      item._id === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Top Categories</h3>
            <div className="space-y-3">
              {spendingByCategory?.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                  <div>
                    <p className="text-[#f5f5f5] font-medium">{item.categoryName}</p>
                    <p className="text-[#ababab] text-sm">{item.count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f5f5f5] font-semibold">{formatVND(item.totalAmount)}</p>
                    <p className="text-[#ababab] text-xs">Avg: {formatVND(item.avgAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Vendors & Monthly Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Top Vendors</h3>
            <div className="space-y-3">
              {spendingByVendor?.length > 0 ? spendingByVendor.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                  <div>
                    <p className="text-[#f5f5f5] font-medium">{item.vendorName}</p>
                    <p className="text-[#ababab] text-sm">{item.count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f5f5f5] font-semibold">{formatVND(item.totalAmount)}</p>
                    <p className="text-[#ababab] text-xs">Avg: {formatVND(item.avgAmount)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-[#ababab] text-center py-4">No vendor data available</p>
              )}
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Monthly Trend</h3>
            <div className="space-y-3">
              {monthlyTrend?.map((item) => (
                <div key={`${item._id.year}-${item._id.month}`} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                  <div>
                    <p className="text-[#f5f5f5] font-medium">
                      {new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                    <p className="text-[#ababab] text-sm">{item.count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f5f5f5] font-semibold">{formatVND(item.totalAmount)}</p>
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
    ...(isAdmin ? [{ label: "Spending", icon: <MdAccountBalanceWallet />, action: "spending" }] : []),
  ];

  const tabs = ["Metrics", "Promotions", ...(isAdmin ? ["Spending"] : [])];

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
    <div className="bg-[#1f1f1f] pb-20">
      {/* Header Section with Action Buttons and Tabs */}
      <div className="container mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between py-8 lg:py-14 px-4 md:px-6 gap-6 lg:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          {buttons.map(({ label, icon, action }) => {
            return (
              <button
                key={action}
                onClick={() => handleOpenModal(action)}
                className="bg-[#1a1a1a] hover:bg-[#262626] px-4 sm:px-6 lg:px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-md flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[1] || label}</span>
                {icon}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          {tabs.map((tab) => {
            return (
              <button
                key={tab}
                className={`
                px-4 sm:px-6 lg:px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-md flex items-center gap-2 w-full sm:w-auto justify-center ${
                  activeTab === tab
                    ? "bg-[#262626]"
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

      {/* Date Filter Section */}
      <div className="container mx-auto px-4 md:px-6 mb-6">
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#343434]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-[#f5f5f5] font-semibold text-lg mb-1">Date Filter</h3>
              <p className="text-[#ababab] text-sm">Filter data by time period</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              {/* Date Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {dateFilterOptions.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => handleDateFilterChange(value)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${dateFilter === value
                        ? "bg-[#f6b100] text-[#1f1f1f]"
                        : "bg-[#262626] text-[#f5f5f5] hover:bg-[#343434]"
                      }
                    `}
                  >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Custom Date Range Inputs */}
              {dateFilter === "custom" && (
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <div className="flex flex-col">
                    <label className="text-[#ababab] text-xs mb-1">From</label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => handleCustomDateChange("startDate", e.target.value)}
                      className="bg-[#262626] text-[#f5f5f5] border border-[#343434] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f6b100]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[#ababab] text-xs mb-1">To</label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => handleCustomDateChange("endDate", e.target.value)}
                      className="bg-[#262626] text-[#f5f5f5] border border-[#343434] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f6b100]"
                    />
                  </div>
                </div>
              )}
            </div>
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

      {isCategoryModalOpen && <CategoryModal setIsCategoryModalOpen={setIsCategoryModalOpen} />}
      {isDishesModalOpen && <DishModal setIsDishesModalOpen={setIsDishesModalOpen} />}
    </div>
  );
};

export default Dashboard;
