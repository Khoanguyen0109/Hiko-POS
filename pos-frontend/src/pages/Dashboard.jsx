import { useState, useEffect } from "react";
import { MdTableBar, MdCategory, MdDateRange, MdToday, MdCalendarMonth, MdLocalOffer } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { MdAddCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import PromotionMetrics from "../components/dashboard/PromotionMetrics";
import Modal from "../components/dashboard/Modal";
import CategoryModal from "../components/dashboard/CategoryModal";
import DishModal from "../components/dashboard/DishModal";

const buttons = [
  { label: "Add Table", icon: <MdTableBar />, action: "table" },
  { label: "Add Category", icon: <MdCategory />, action: "category" },
  { label: "Add Dishes", icon: <BiSolidDish />, action: "dishes" },
  { label: "Add Topping", icon: <MdAddCircle />, action: "topping" },
  { label: "Add Promotion", icon: <MdLocalOffer />, action: "promotion" },
];

const tabs = ["Metrics", "Orders", "Promotions", "Payments"];

const dateFilterOptions = [
  { value: "today", label: "Today", icon: <MdToday /> },
  { value: "week", label: "This Week", icon: <MdDateRange /> },
  { value: "month", label: "This Month", icon: <MdCalendarMonth /> },
  { value: "custom", label: "Custom Range", icon: <MdDateRange /> },
];

const Dashboard = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "POS | Admin Dashboard";
  }, []);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDishesModalOpen, setIsDishesModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Metrics");
  const [dateFilter, setDateFilter] = useState("today");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  const handleOpenModal = (action) => {
    if (action === "table") setIsTableModalOpen(true);
    if (action === "category") setIsCategoryModalOpen(true);
    if (action === "dishes") setIsDishesModalOpen(true);
    if (action === "topping") navigate(ROUTES.TOPPINGS);
    if (action === "promotion") navigate(ROUTES.PROMOTIONS);
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
      {activeTab === "Orders" && (
        <RecentOrders 
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
      {activeTab === "Payments" && (
        <div className="text-white p-6 container mx-auto">
          Payment Component Coming Soon
        </div>
      )}

      {isTableModalOpen && <Modal setIsTableModalOpen={setIsTableModalOpen} />}
      {isCategoryModalOpen && <CategoryModal setIsCategoryModalOpen={setIsCategoryModalOpen} />}
      {isDishesModalOpen && <DishModal setIsDishesModalOpen={setIsDishesModalOpen} />}
    </div>
  );
};

export default Dashboard;
